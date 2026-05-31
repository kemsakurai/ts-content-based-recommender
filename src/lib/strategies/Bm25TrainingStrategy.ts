import {
  Document,
  SimilarDocument,
} from '../../types/index.js';
import { Bm25SimilarityService } from '../services/Bm25SimilarityService.js';
import { DocumentPreprocessor } from '../services/DocumentPreprocessor.js';
import { AbstractTrainingStrategy } from './AbstractTrainingStrategy.js';
import {
  RecommenderTrainingContext,
  RecommenderTrainingStrategyMetadata,
} from './RecommenderTrainingStrategy.js';

/** BM25 学習戦略メタデータ */
export const bm25TrainingStrategyMetadata: RecommenderTrainingStrategyMetadata = {
  tokenFilterOptionsDefaults: {
    removeDuplicates: false,
  }
};

/**
 * BM25 学習戦略
 */
export class Bm25TrainingStrategy extends AbstractTrainingStrategy {
  /** BM25 類似度計算サービス */
  private bm25SimilarityService: Bm25SimilarityService;

  /**
   * コンストラクタ
   * @param documentPreprocessor 文書前処理サービス
   * @param bm25SimilarityService BM25 類似度計算サービス
   */
  constructor(
    documentPreprocessor: DocumentPreprocessor = new DocumentPreprocessor(),
    bm25SimilarityService: Bm25SimilarityService = new Bm25SimilarityService()
  ) {
    super(documentPreprocessor);
    this.bm25SimilarityService = bm25SimilarityService;
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

    const processedDocuments = await this.preprocessDocuments(documents, context);
    return this.bm25SimilarityService.calculate(processedDocuments, context.options);
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

    const { processedDocuments, targetProcessedDocuments } = await this.preprocessBidirectionalDocuments(
      documents,
      targetDocuments,
      context
    );

    return this.bm25SimilarityService.calculateBetweenCollections(
      processedDocuments,
      targetProcessedDocuments,
      context.options
    );
  }
}
