import striptags from 'striptags';
import {
  Document,
  SimilarDocument,
} from '../../types/index.js';
import { EmbeddingService } from '../services/EmbeddingService.js';
import { SimilarityResultBuilder } from '../services/SimilarityResultBuilder.js';
import { DocumentPreprocessor } from '../services/DocumentPreprocessor.js';
import { AbstractTrainingStrategy } from './AbstractTrainingStrategy.js';
import {
  RecommenderTrainingContext,
  RecommenderTrainingStrategyMetadata,
} from './RecommenderTrainingStrategy.js';

/** 埋め込み学習戦略メタデータ */
export const embeddingTrainingStrategyMetadata: RecommenderTrainingStrategyMetadata = {};

/** デフォルトの埋め込みモデル名 */
const DEFAULT_EMBEDDING_MODEL = 'Xenova/multilingual-e5-small';

/**
 * Wasm (ONNX) 埋め込みベースの学習戦略。
 * @xenova/transformers を使いローカルで埋め込みを生成し、
 * コサイン類似度で推薦を行う。
 */
export class EmbeddingTrainingStrategy extends AbstractTrainingStrategy {
  /** 類似度結果構築サービス */
  private similarityResultBuilder: SimilarityResultBuilder;

  /**
   * コンストラクタ
   * @param documentPreprocessor 文書前処理サービス（スーパークラスへ渡す）
   * @param similarityResultBuilder 類似度結果構築サービス
   */
  constructor(
    documentPreprocessor: DocumentPreprocessor = new DocumentPreprocessor(),
    similarityResultBuilder: SimilarityResultBuilder = new SimilarityResultBuilder()
  ) {
    super(documentPreprocessor);
    this.similarityResultBuilder = similarityResultBuilder;
  }

  /**
   * 単一コレクションの学習を実行する
   * @param documents 学習対象の文書配列
   * @param context 学習コンテキスト
   * @returns 類似度データ
   */
  public async train(
    documents: Document[],
    context: RecommenderTrainingContext
  ): Promise<Record<string, SimilarDocument[]>> {
    this.logTotalDocuments(documents, context);

    const model = context.options.embeddingModel ?? DEFAULT_EMBEDDING_MODEL;
    const texts = documents.map((document) => this._cleanText(document.content));
    const vectors = await EmbeddingService.embed(texts, model);

    return this._calculateSimilarities(documents, vectors, context);
  }

  /**
   * 双方向学習を実行する
   * @param documents メインの文書配列
   * @param targetDocuments ターゲット文書配列
   * @param context 学習コンテキスト
   * @returns 類似度データ
   */
  public async trainBidirectional(
    documents: Document[],
    targetDocuments: Document[],
    context: RecommenderTrainingContext
  ): Promise<Record<string, SimilarDocument[]>> {
    this.logTotalDocuments(documents, context);

    const model = context.options.embeddingModel ?? DEFAULT_EMBEDDING_MODEL;
    const allDocuments = [...documents, ...targetDocuments];
    const texts = allDocuments.map((document) => this._cleanText(document.content));
    const allVectors = await EmbeddingService.embed(texts, model);

    const documentVectors = allVectors.slice(0, documents.length);
    const targetVectors = allVectors.slice(documents.length);

    return this._calculateBidirectionalSimilarities(
      documents,
      documentVectors,
      targetDocuments,
      targetVectors,
      context
    );
  }

  /**
   * HTMLタグを除去してテキストを正規化する
   * @param text 対象テキスト
   * @returns 正規化済みテキスト
   */
  private _cleanText(text: string): string {
    return striptags(text).trim();
  }

  /**
   * 正規化済みベクトル同士の dot product でコサイン類似度を計算する
   * @param a ベクトルA
   * @param b ベクトルB
   * @returns コサイン類似度（0〜1）
   */
  private _cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;

    for (let i = 0; i < a.length; i += 1) {
      dot += a[i] * b[i];
    }

    // L2 正規化済みのため dot product = cosine similarity、念のため [0, 1] にクリップする
    return Math.max(0, Math.min(1, dot));
  }

  /**
   * 同一コレクション内で類似度を計算する
   * @param documents 文書配列
   * @param vectors 埋め込みベクトル配列
   * @param context 学習コンテキスト
   * @returns 類似度データ
   */
  private _calculateSimilarities(
    documents: Document[],
    vectors: Float32Array[],
    context: RecommenderTrainingContext
  ): Record<string, SimilarDocument[]> {
    const data = this.similarityResultBuilder.initializeDataHash(documents);

    for (let i = 0; i < documents.length; i += 1) {
      if (context.options.debug) {
        console.log(`Calculating embedding similarity for document ${i}`);
      }

      for (let j = 0; j < i; j += 1) {
        const similarity = this._cosineSimilarity(vectors[i], vectors[j]);

        if (similarity > context.options.minScore!) {
          data[documents[i].id].push({ id: documents[j].id, score: similarity });
          data[documents[j].id].push({ id: documents[i].id, score: similarity });
        }
      }
    }

    this.similarityResultBuilder.orderDocuments(data, context.options);

    return data;
  }

  /**
   * 2つのコレクション間で類似度を計算する
   * @param documents メイン文書配列
   * @param documentVectors メイン文書の埋め込みベクトル配列
   * @param targetDocuments ターゲット文書配列
   * @param targetVectors ターゲット文書の埋め込みベクトル配列
   * @param context 学習コンテキスト
   * @returns 類似度データ
   */
  private _calculateBidirectionalSimilarities(
    documents: Document[],
    documentVectors: Float32Array[],
    targetDocuments: Document[],
    targetVectors: Float32Array[],
    context: RecommenderTrainingContext
  ): Record<string, SimilarDocument[]> {
    const data = {
      ...this.similarityResultBuilder.initializeDataHash(documents),
      ...this.similarityResultBuilder.initializeDataHash(targetDocuments),
    };

    for (let i = 0; i < documents.length; i += 1) {
      if (context.options.debug) {
        console.log(`Calculating embedding similarity for document ${i}`);
      }

      for (let j = 0; j < targetDocuments.length; j += 1) {
        const similarity = this._cosineSimilarity(documentVectors[i], targetVectors[j]);

        if (similarity > context.options.minScore!) {
          data[documents[i].id].push({ id: targetDocuments[j].id, score: similarity });
          data[targetDocuments[j].id].push({ id: documents[i].id, score: similarity });
        }
      }
    }

    this.similarityResultBuilder.orderDocuments(data, context.options);

    return data;
  }
}
