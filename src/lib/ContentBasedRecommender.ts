import * as _ from 'underscore';
import Vector from 'vector-object';
import { Matrix, SingularValueDecomposition } from 'ml-matrix';
import {
  Document,
  RecommenderOptions,
  SimilarDocument,
  ExportedModel,
  ProcessedDocument,
  ProcessingPipeline,
} from '../types/index.js';
import { ProcessingPipelineFactory } from './factories/ProcessingPipelineFactory.js';
import { JapaneseTokenizer } from './tokenizers/JapaneseTokenizer.js';
import { EnglishTokenFilter } from './filters/EnglishTokenFilter.js';
import { JapaneseTokenFilter } from './filters/JapaneseTokenFilter.js';
import natural from 'natural';

const { TfIdf } = natural;

/**
 * デフォルト設定オプション
 */
const defaultOptions: RecommenderOptions = {
  maxVectorSize: 100,
  maxSimilarDocuments: Number.MAX_SAFE_INTEGER,
  minScore: 0,
  debug: false,
  algorithm: 'tfidf',
  language: 'en',
  lsaDimensions: 12,
  tokenFilterOptions: {
    removeDuplicates: true,
    removeStopwords: true,
    customStopWords: [],
    minTokenLength: 1,
    allowedPos: ['名詞', '動詞', '形容詞']
  }
};

/**
 * 文書ベクトルインターフェース
 */
interface DocumentVector {
  /** 文書ID */
  id: string;
  /** ベクトルオブジェクト */
  vector: Vector;
}

/**
 * コンテンツベース推薦システムのメインクラス
 * TF-IDFとコサイン類似度を使用して文書間の類似性を計算し、類似したアイテムを推薦します
 */
class ContentBasedRecommender {
  /** 推薦システムの設定オプション */
  private options: RecommenderOptions;

  /** 文書間の類似度データ */
  private data: Record<string, SimilarDocument[]>;

  /** 処理パイプライン（トークナイザー + フィルター） */
  private pipeline: ProcessingPipeline;

  /**
   * ContentBasedRecommenderのコンストラクタ
   * @param options 推薦システムの設定オプション
   */
  constructor(options: RecommenderOptions = {}) {
    this.setOptions(options);
    this.data = {};

    // 処理パイプラインの初期化
    this.pipeline = ProcessingPipelineFactory.createPipeline(this.options.language!, this.options.tokenFilterOptions);
  }

  /**
   * 設定オプションを設定・検証する
   * @param options 設定オプション
   * @throws {Error} 無効なオプションが指定された場合
   */
  public setOptions(options: RecommenderOptions = {}): void {
    // バリデーション
    if ((options.maxVectorSize !== undefined) &&
      (!Number.isInteger(options.maxVectorSize) || options.maxVectorSize <= 0)) {
      throw new Error('The option maxVectorSize should be integer and greater than 0');
    }

    if ((options.maxSimilarDocuments !== undefined) &&
      (!Number.isInteger(options.maxSimilarDocuments) || options.maxSimilarDocuments <= 0)) {
      throw new Error('The option maxSimilarDocuments should be integer and greater than 0');
    }

    if ((options.minScore !== undefined) &&
      (!_.isNumber(options.minScore) || options.minScore < 0 || options.minScore > 1)) {
      throw new Error('The option minScore should be a number between 0 and 1');
    }

    if ((options.algorithm !== undefined) &&
      (!_.isString(options.algorithm) || !['tfidf', 'lsa'].includes(options.algorithm))) {
      throw new Error('The option algorithm should be either "tfidf" or "lsa"');
    }

    if ((options.language !== undefined) &&
      (!_.isString(options.language) || !['en', 'ja'].includes(options.language))) {
      throw new Error('The option language should be either "en" or "ja"');
    }

    if ((options.lsaDimensions !== undefined) &&
      (!Number.isInteger(options.lsaDimensions) || options.lsaDimensions <= 0)) {
      throw new Error('The option lsaDimensions should be integer and greater than 0');
    }

    const prevLanguage = this.options?.language;
    this.options = Object.assign({}, defaultOptions, options);

    // 言語が変更された場合、処理パイプラインを再初期化
    if (this.pipeline && prevLanguage !== this.options.language) {
      this.pipeline = ProcessingPipelineFactory.createPipeline(this.options.language!, this.options.tokenFilterOptions);
    }
  }

  /**
   * 単一コレクションの文書を学習する
   * @param documents 学習対象の文書配列
   */
  public async train(documents: Document[]): Promise<void> {
    this.validateDocuments(documents);

    if (this.options.debug) {
      console.log(`Total documents: ${documents.length}`);
    }

    // ステップ1 - 文書の前処理
    const preprocessDocs = await this._preprocessDocuments(documents, this.options);

    // ステップ2 - 文書ベクトルの作成
    const docVectors = this._produceWordVectors(preprocessDocs, this.options);

    // ステップ3 - 類似度の計算
    this.data = this._calculateSimilarities(docVectors, this.options);
  }

  /**
   * 双方向学習（異なるコレクション間の類似度計算）
   * @param documents メインの文書配列
   * @param targetDocuments ターゲット文書配列
   */
  public async trainBidirectional(documents: Document[], targetDocuments: Document[]): Promise<void> {
    this.validateDocuments(documents);
    this.validateDocuments(targetDocuments);

    if (this.options.debug) {
      console.log(`Total documents: ${documents.length}`);
    }

    // ステップ1 - 文書の前処理
    const preprocessDocs = await this._preprocessDocuments(documents, this.options);
    const preprocessTargetDocs = await this._preprocessDocuments(targetDocuments, this.options);

    // ステップ2 - 文書ベクトルの作成
    const { documentVectors: docVectors, targetDocumentVectors: targetDocVectors } = this._produceBidirectionalWordVectors(
      preprocessDocs,
      preprocessTargetDocs,
      this.options
    );

    // ステップ3 - 類似度の計算
    this.data = this._calculateSimilaritiesBetweenTwoVectors(docVectors, targetDocVectors, this.options);
  }

  /**
   * 文書配列のバリデーション
   * @param documents 検証対象の文書配列
   * @throws {Error} 無効な文書配列が指定された場合
   */
  public validateDocuments(documents: Document[]): void {
    if (!_.isArray(documents)) {
      throw new Error('Documents should be an array of objects');
    }

    for (let i = 0; i < documents.length; i += 1) {
      const document = documents[i];

      if (!_.has(document, 'id') || !_.has(document, 'content')) {
        throw new Error('Documents should be have fields id and content');
      }

      if (_.has(document, 'tokens') || _.has(document, 'vector')) {
        throw new Error('"tokens" and "vector" properties are reserved and cannot be used as document properties');
      }
    }
  }

  /**
   * 指定IDの類似文書を取得する
   * @param id 文書ID
   * @param start 開始インデックス（デフォルト: 0）
   * @param size 取得サイズ（未指定の場合は全て）
   * @returns 類似文書の配列
   */
  public getSimilarDocuments(id: string, start: number = 0, size?: number): SimilarDocument[] {
    let similarDocuments = this.data[id];

    if (similarDocuments === undefined) {
      return [];
    }

    const end = (size !== undefined) ? start + size : undefined;
    similarDocuments = similarDocuments.slice(start, end);

    return similarDocuments;
  }

  /**
   * 学習済みモデルをエクスポートする
   * @returns エクスポートデータ
   */
  public export(): Partial<ExportedModel> {
    return {
      options: this.options,
      data: this.data,
    };
  }

  /**
   * エクスポートされたモデルをインポートする
   * @param object インポートするモデルデータ
   */
  public import(object: Partial<ExportedModel>): void {
    const { options, data } = object;

    if (options) {
      this.setOptions(options);
    }
    if (data) {
      this.data = data;
    }
  }

  // プライベートメソッド

  /**
   * 文書の前処理（トークン化、ステミング等）
   * @param documents 対象文書配列
   * @param options 設定オプション
   * @returns 前処理済み文書配列
   */
  private async _preprocessDocuments(documents: Document[], options: RecommenderOptions): Promise<ProcessedDocument[]> {
    if (options.debug) {
      console.log('Preprocessing documents');
    }

    const processedDocuments = await Promise.all(documents.map(async item => {
      const tokens = await this._getTokensFromString(item.content);
      return {
        id: item.id,
        tokens,
        originalDocument: item,
      };
    }));

    return processedDocuments;
  }

  /**
   * 文字列からトークンを抽出する
   * @param string 対象文字列
   * @returns トークン配列のPromise
   */
  private async _getTokensFromString(string: string): Promise<string[]> {
    // トークン化
    const rawTokens = await this.pipeline.tokenizer.tokenize(string);

    // フィルタリング
    if (this.options.language === 'ja') {
      // 日本語の場合、品詞情報を含む詳細トークンを取得してフィルタリング
      const japaneseTokenizer = this.pipeline.tokenizer as JapaneseTokenizer;
      const japaneseFilter = this.pipeline.filter as JapaneseTokenFilter;
      const detailedTokens = await japaneseTokenizer.getDetailedJapaneseTokens(string);
      return japaneseFilter.filterWithPos(detailedTokens);
    } else if (this.options.language === 'en') {
      // 英語の場合、N-gram対応フィルタリング
      const englishFilter = this.pipeline.filter as EnglishTokenFilter;
      return englishFilter.filterWithNgrams(rawTokens);
    } else {
      // その他の場合、通常のフィルタリング
      return this.pipeline.filter.filter(rawTokens);
    }
  }

  /**
   * 類似文書を降順でソートし、最大数を制限する
   * @param data 類似度データ
   * @param options 設定オプション
   */
  private orderDocuments(data: Record<string, SimilarDocument[]>, options: RecommenderOptions): void {
    // 類似文書を降順でソート
    Object.keys(data)
      .forEach((id) => {
        data[id].sort((a, b) => b.score - a.score);

        if (data[id].length > options.maxSimilarDocuments!) {
          data[id] = data[id].slice(0, options.maxSimilarDocuments);
        }
      });
  }

  /**
   * 文書ベクトルを生成する
   * @param processedDocuments 前処理済み文書配列
   * @param options 設定オプション
   * @returns 文書ベクトル配列
   */
  private _produceWordVectors(processedDocuments: ProcessedDocument[], options: RecommenderOptions): DocumentVector[] {
    if (options.algorithm === 'lsa') {
      return this._produceLsaWordVectors(processedDocuments, options);
    }

    return this._produceTfIdfWordVectors(processedDocuments, options);
  }

  /**
   * 双方向学習向けに文書ベクトルを生成する
   * @param processedDocuments メイン文書配列
   * @param targetProcessedDocuments ターゲット文書配列
   * @param options 設定オプション
   * @returns 生成済みベクトル
   */
  private _produceBidirectionalWordVectors(
    processedDocuments: ProcessedDocument[],
    targetProcessedDocuments: ProcessedDocument[],
    options: RecommenderOptions
  ): { documentVectors: DocumentVector[]; targetDocumentVectors: DocumentVector[] } {
    if (options.algorithm !== 'lsa') {
      return {
        documentVectors: this._produceTfIdfWordVectors(processedDocuments, options),
        targetDocumentVectors: this._produceTfIdfWordVectors(targetProcessedDocuments, options)
      };
    }

    const allDocuments = processedDocuments.concat(targetProcessedDocuments);
    const allVectors = this._produceLsaWordVectors(allDocuments, options);
    const splitIndex = processedDocuments.length;

    return {
      documentVectors: allVectors.slice(0, splitIndex),
      targetDocumentVectors: allVectors.slice(splitIndex)
    };
  }

  /**
   * TF-IDFベースの文書ベクトルを生成する
   * @param processedDocuments 前処理済み文書配列
   * @param options 設定オプション
   * @returns 文書ベクトル配列
   */
  private _produceTfIdfWordVectors(processedDocuments: ProcessedDocument[], options: RecommenderOptions): DocumentVector[] {
    // TF-IDFの処理
    const tfidf = new TfIdf();

    processedDocuments.forEach((processedDocument) => {
      tfidf.addDocument(processedDocument.tokens);
    });

    // ワードベクトルの作成
    const documentVectors: DocumentVector[] = [];

    for (let i = 0; i < processedDocuments.length; i += 1) {
      if (options.debug) {
        console.log(`Creating word vector for document ${i}`);
      }

      const processedDocument = processedDocuments[i];
      const hash: Record<string, number> = {};

      const items = tfidf.listTerms(i);
      const maxSize = Math.min(options.maxVectorSize!, items.length);
      for (let j = 0; j < maxSize; j += 1) {
        const item = items[j];
        hash[item.term] = item.tfidf;
      }

      const documentVector: DocumentVector = {
        id: processedDocument.id,
        vector: new Vector(hash),
      };

      documentVectors.push(documentVector);
    }

    return documentVectors;
  }

  /**
   * LSAベースの文書ベクトルを生成する
   * @param processedDocuments 前処理済み文書配列
   * @param options 設定オプション
   * @returns 文書ベクトル配列
   */
  private _produceLsaWordVectors(processedDocuments: ProcessedDocument[], options: RecommenderOptions): DocumentVector[] {
    if (processedDocuments.length === 0) {
      return [];
    }

    const { matrix } = this._buildTfIdfMatrix(processedDocuments);
    if (matrix.columns === 0) {
      return this._createZeroVectors(processedDocuments);
    }

    const shouldTranspose = matrix.columns > matrix.rows;
    const matrixForSvd = shouldTranspose ? matrix.transpose() : matrix;
    const svd = new SingularValueDecomposition(matrixForSvd, {
      autoTranspose: false,
    });
    const singularValues = svd.diagonal;
    if (singularValues.length === 0) {
      return this._createZeroVectors(processedDocuments);
    }

    const latentDimensions = Math.min(options.lsaDimensions!, singularValues.length);
    const documentBasis = shouldTranspose
      ? svd.rightSingularVectors.subMatrix(0, processedDocuments.length - 1, 0, latentDimensions - 1)
      : svd.leftSingularVectors.subMatrix(0, processedDocuments.length - 1, 0, latentDimensions - 1);
    const truncatedDiagonal = Matrix.diag(singularValues.slice(0, latentDimensions));
    const reducedMatrix = documentBasis.mmul(truncatedDiagonal);

    return processedDocuments.map((processedDocument, index) => {
      const hash: Record<string, number> = {};

      for (let dimensionIndex = 0; dimensionIndex < latentDimensions; dimensionIndex += 1) {
        hash[`dim_${dimensionIndex}`] = reducedMatrix.get(index, dimensionIndex);
      }

      return {
        id: processedDocument.id,
        vector: new Vector(hash),
      };
    });
  }

  /**
   * LSA用のTF-IDF行列を構築する
   * @param processedDocuments 前処理済み文書配列
   * @returns TF-IDF行列
   */
  private _buildTfIdfMatrix(processedDocuments: ProcessedDocument[]): { matrix: Matrix; terms: string[] } {
    const termSet = new Set<string>();
    const termDocumentFrequency = new Map<string, number>();

    processedDocuments.forEach((processedDocument) => {
      const uniqueTerms = new Set(processedDocument.tokens);

      processedDocument.tokens.forEach((token) => {
        termSet.add(token);
      });

      uniqueTerms.forEach((term) => {
        termDocumentFrequency.set(term, (termDocumentFrequency.get(term) ?? 0) + 1);
      });
    });

    const terms = Array.from(termSet).sort();
    const matrix = Matrix.zeros(processedDocuments.length, terms.length);
    const totalDocuments = processedDocuments.length;

    processedDocuments.forEach((processedDocument, rowIndex) => {
      const termFrequency = processedDocument.tokens.reduce((acc: Record<string, number>, token) => {
        acc[token] = (acc[token] ?? 0) + 1;
        return acc;
      }, {});

      terms.forEach((term, columnIndex) => {
        const tf = termFrequency[term] ?? 0;
        if (tf === 0) {
          return;
        }

        const documentFrequency = termDocumentFrequency.get(term) ?? 0;
        const idf = Math.log((1 + totalDocuments) / (1 + documentFrequency)) + 1;
        matrix.set(rowIndex, columnIndex, tf * idf);
      });
    });

    return { matrix, terms };
  }

  /**
   * ゼロベクトルの文書ベクトル配列を生成する
   * @param processedDocuments 前処理済み文書配列
   * @returns 文書ベクトル配列
   */
  private _createZeroVectors(processedDocuments: ProcessedDocument[]): DocumentVector[] {
    return processedDocuments.map((processedDocument) => ({
      id: processedDocument.id,
      vector: new Vector({}),
    }));
  }

  /**
   * 2つのベクトルセット間の類似度を計算する（双方向学習用）
   * @param documentVectors メイン文書のベクトル配列
   * @param targetDocumentVectors ターゲット文書のベクトル配列
   * @param options 設定オプション
   * @returns 類似度データ
   */
  private _calculateSimilaritiesBetweenTwoVectors(
    documentVectors: DocumentVector[],
    targetDocumentVectors: DocumentVector[],
    options: RecommenderOptions
  ): Record<string, SimilarDocument[]> {
    const data = {
      ...this.initializeDataHash(documentVectors),
      ...this.initializeDataHash(targetDocumentVectors)
    };

    // 類似度スコアの計算
    for (let i = 0; i < documentVectors.length; i += 1) {
      if (options.debug) console.log(`Calculating similarity score for document ${i}`);

      for (let j = 0; j < targetDocumentVectors.length; j += 1) {
        const documentVectorA = documentVectors[i];
        const targetDocumentVectorB = targetDocumentVectors[j];
        const idi = documentVectorA.id;
        const vi = documentVectorA.vector;
        const idj = targetDocumentVectorB.id;
        const vj = targetDocumentVectorB.vector;
        const similarity = this._getCosineSimilarity(vi, vj);

        if (similarity > options.minScore!) {
          data[idi].push({
            id: targetDocumentVectorB.id,
            score: similarity
          });
          data[idj].push({
            id: documentVectorA.id,
            score: similarity
          });
        }
      }
    }

    this.orderDocuments(data, options);

    return data;
  }

  /**
   * データハッシュを初期化する
   * @param documentVectors 文書ベクトル配列
   * @returns 初期化されたデータハッシュ
   */
  private initializeDataHash(documentVectors: DocumentVector[]): Record<string, SimilarDocument[]> {
    return documentVectors.reduce((acc: Record<string, SimilarDocument[]>, item) => {
      acc[item.id] = [];
      return acc;
    }, {});
  }

  /**
   * 同一コレクション内の類似度を計算する
   * @param documentVectors 文書ベクトル配列
   * @param options 設定オプション
   * @returns 類似度データ
   */
  private _calculateSimilarities(documentVectors: DocumentVector[], options: RecommenderOptions): Record<string, SimilarDocument[]> {
    const data = { ...this.initializeDataHash(documentVectors) };

    // 類似度スコアの計算
    for (let i = 0; i < documentVectors.length; i += 1) {
      if (options.debug) console.log(`Calculating similarity score for document ${i}`);

      for (let j = 0; j < i; j += 1) {
        const documentVectorA = documentVectors[i];
        const idi = documentVectorA.id;
        const vi = documentVectorA.vector;
        const documentVectorB = documentVectors[j];
        const idj = documentVectorB.id;
        const vj = documentVectorB.vector;
        const similarity = this._getCosineSimilarity(vi, vj);

        if (similarity > options.minScore!) {
          data[idi].push({
            id: documentVectorB.id,
            score: similarity
          });

          data[idj].push({
            id: documentVectorA.id,
            score: similarity
          });
        }
      }
    }

    this.orderDocuments(data, options);

    return data;
  }

  /**
   * コサイン類似度を安全に取得する
   * @param vectorA ベクトルA
   * @param vectorB ベクトルB
   * @returns コサイン類似度
   */
  private _getCosineSimilarity(vectorA: Vector, vectorB: Vector): number {
    const similarity = vectorA.getCosineSimilarity(vectorB);
    return Number.isFinite(similarity) ? similarity : 0;
  }
}

export default ContentBasedRecommender;
