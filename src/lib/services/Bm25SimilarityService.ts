import MiniSearch from 'minisearch';
import {
  ProcessedDocument,
  RecommenderOptions,
  SimilarDocument,
} from '../../types/index.js';
import { SimilarityResultBuilder } from './SimilarityResultBuilder.js';

/**
 * BM25索引用の文書インターフェース
 */
interface Bm25SearchDocument {
  /** 文書ID */
  id: string;
  /** 本文の検索用文字列 */
  content: string;
  /** タイトルの検索用文字列 */
  title?: string;
}

/**
 * BM25検索結果の最小インターフェース
 */
interface Bm25SearchResult {
  /** 文書ID */
  id: string;
  /** BM25スコア */
  score: number;
}

/**
 * BM25類似度計算サービス
 */
export class Bm25SimilarityService {
  /** 類似度結果構築サービス */
  private similarityResultBuilder: SimilarityResultBuilder;

  /**
   * コンストラクタ
   * @param similarityResultBuilder 類似度結果構築サービス
   */
  constructor(similarityResultBuilder: SimilarityResultBuilder = new SimilarityResultBuilder()) {
    this.similarityResultBuilder = similarityResultBuilder;
  }

  /**
   * 同一コレクション向けのBM25類似度を計算する
   * @param processedDocuments 前処理済み文書配列
   * @param options 設定オプション
   * @returns 類似度データ
   */
  public calculate(
    processedDocuments: ProcessedDocument[],
    options: RecommenderOptions
  ): Record<string, SimilarDocument[]> {
    const data = this.similarityResultBuilder.initializeDataHash(processedDocuments);
    const bm25Index = this.createBm25Index(processedDocuments);

    processedDocuments.forEach((processedDocument, index) => {
      if (options.debug) {
        console.log(`Calculating BM25 score for document ${index}`);
      }

      data[processedDocument.id] = this.searchBm25Index(bm25Index, processedDocument, processedDocument.id, options);
    });

    this.similarityResultBuilder.orderDocuments(data, options);

    return data;
  }

  /**
   * 双方向学習向けのBM25類似度を計算する
   * @param processedDocuments メイン文書配列
   * @param targetProcessedDocuments ターゲット文書配列
   * @param options 設定オプション
   * @returns 類似度データ
   */
  public calculateBetweenCollections(
    processedDocuments: ProcessedDocument[],
    targetProcessedDocuments: ProcessedDocument[],
    options: RecommenderOptions
  ): Record<string, SimilarDocument[]> {
    const data = {
      ...this.similarityResultBuilder.initializeDataHash(processedDocuments),
      ...this.similarityResultBuilder.initializeDataHash(targetProcessedDocuments)
    };
    const documentIndex = this.createBm25Index(processedDocuments);
    const targetDocumentIndex = this.createBm25Index(targetProcessedDocuments);

    processedDocuments.forEach((processedDocument, index) => {
      if (options.debug) {
        console.log(`Calculating BM25 score for source document ${index}`);
      }

      data[processedDocument.id] = this.searchBm25Index(
        targetDocumentIndex,
        processedDocument,
        processedDocument.id,
        options
      );
    });

    targetProcessedDocuments.forEach((processedDocument, index) => {
      if (options.debug) {
        console.log(`Calculating BM25 score for target document ${index}`);
      }

      data[processedDocument.id] = this.searchBm25Index(
        documentIndex,
        processedDocument,
        processedDocument.id,
        options
      );
    });

    this.similarityResultBuilder.orderDocuments(data, options);

    return data;
  }

  /**
   * BM25用のインデックスを生成する
   * @param processedDocuments 前処理済み文書配列
   * @returns MiniSearchインデックス
   */
  private createBm25Index(processedDocuments: ProcessedDocument[]): MiniSearch<Bm25SearchDocument> {
    const miniSearch = new MiniSearch<Bm25SearchDocument>({
      fields: ['title', 'content'],
    });
    const searchDocuments = this.createBm25SearchDocuments(processedDocuments);

    if (searchDocuments.length > 0) {
      miniSearch.addAll(searchDocuments);
    }

    return miniSearch;
  }

  /**
   * BM25用の索引文書配列を生成する
   * @param processedDocuments 前処理済み文書配列
   * @returns 索引用文書配列
   */
  private createBm25SearchDocuments(processedDocuments: ProcessedDocument[]): Bm25SearchDocument[] {
    return processedDocuments.map((processedDocument) => {
      const title = this.joinBm25Tokens(processedDocument.titleTokens ?? []);

      return {
        id: processedDocument.id,
        content: this.joinBm25Tokens(processedDocument.tokens),
        ...(title ? { title } : {})
      };
    });
  }

  /**
   * BM25インデックスを検索する
   * @param bm25Index MiniSearchインデックス
   * @param processedDocument 検索元文書
   * @param sourceDocumentId 除外対象の文書ID
   * @param options 設定オプション
   * @returns 類似文書配列
   */
  private searchBm25Index(
    bm25Index: MiniSearch<Bm25SearchDocument>,
    processedDocument: ProcessedDocument,
    sourceDocumentId: string,
    options: RecommenderOptions
  ): SimilarDocument[] {
    const query = this.buildBm25Query(processedDocument);
    if (!query) {
      return [];
    }

    const results = bm25Index.search(query) as Bm25SearchResult[];

    return results
      .filter((result) => result.id !== sourceDocumentId)
      .filter((result) => Number.isFinite(result.score) && result.score > options.minScore!)
      .map((result) => ({
        id: result.id,
        score: result.score,
      }))
      .slice(0, options.maxSimilarDocuments);
  }

  /**
   * BM25検索クエリを構築する
   * @param processedDocument 前処理済み文書
   * @returns 検索クエリ文字列
   */
  private buildBm25Query(processedDocument: ProcessedDocument): string {
    const queryTokens = [
      ...(processedDocument.titleTokens ?? []),
      ...processedDocument.tokens,
    ];

    return this.joinBm25Tokens(queryTokens);
  }

  /**
   * BM25用にトークン配列を結合する
   * @param tokens トークン配列
   * @returns スペース結合済み文字列
   */
  private joinBm25Tokens(tokens: string[]): string {
    return tokens.join(' ').trim();
  }
}
