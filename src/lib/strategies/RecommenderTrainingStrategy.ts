import {
  Document,
  ProcessingPipeline,
  RecommenderOptions,
  SimilarDocument,
  TokenFilterOptions,
} from '../../types/index.js';

/**
 * 学習戦略の実行コンテキスト
 */
export interface RecommenderTrainingContext {
  /** 推薦設定 */
  options: RecommenderOptions;
  /** 処理パイプライン */
  pipeline: ProcessingPipeline;
}

/**
 * 学習戦略に紐づくメタデータ
 */
export interface RecommenderTrainingStrategyMetadata {
  /** アルゴリズム固有のオプション既定値 */
  optionDefaults?: Partial<RecommenderOptions>;
  /** アルゴリズム固有のトークンフィルター既定値 */
  tokenFilterOptionsDefaults?: TokenFilterOptions;
}

/**
 * 推薦学習戦略インターフェース
 */
export interface RecommenderTrainingStrategy {
  /**
   * 単一コレクションの学習を実行する
   * @param documents 学習対象の文書配列
   * @param context 学習コンテキスト
   * @returns 類似度データ
   */
  train(documents: Document[], context: RecommenderTrainingContext): Promise<Record<string, SimilarDocument[]>>;

  /**
   * 双方向学習を実行する
   * @param documents メインの文書配列
   * @param targetDocuments ターゲット文書配列
   * @param context 学習コンテキスト
   * @returns 類似度データ
   */
  trainBidirectional(
    documents: Document[],
    targetDocuments: Document[],
    context: RecommenderTrainingContext
  ): Promise<Record<string, SimilarDocument[]>>;
}
