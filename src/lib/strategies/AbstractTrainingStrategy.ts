import {
  Document,
  ProcessedDocument,
  SimilarDocument,
} from '../../types/index.js';
import { DocumentPreprocessor } from '../services/DocumentPreprocessor.js';
import {
  RecommenderTrainingContext,
  RecommenderTrainingStrategy,
} from './RecommenderTrainingStrategy.js';

/**
 * 学習戦略の共通基底クラス
 */
export abstract class AbstractTrainingStrategy implements RecommenderTrainingStrategy {
  /** 文書前処理サービス */
  protected documentPreprocessor: DocumentPreprocessor;

  /**
   * コンストラクタ
   * @param documentPreprocessor 文書前処理サービス
   */
  constructor(documentPreprocessor: DocumentPreprocessor = new DocumentPreprocessor()) {
    this.documentPreprocessor = documentPreprocessor;
  }

  /**
   * 単一コレクションの学習を実行する
   * @param documents 学習対象の文書配列
   * @param context 学習コンテキスト
   * @returns 類似度データ
   */
  public abstract train(
    documents: Document[],
    context: RecommenderTrainingContext
  ): Promise<Record<string, SimilarDocument[]>>;

  /**
   * 双方向学習を実行する
   * @param documents メインの文書配列
   * @param targetDocuments ターゲット文書配列
   * @param context 学習コンテキスト
   * @returns 類似度データ
   */
  public abstract trainBidirectional(
    documents: Document[],
    targetDocuments: Document[],
    context: RecommenderTrainingContext
  ): Promise<Record<string, SimilarDocument[]>>;

  /**
   * 対象文書数をデバッグ出力する
   * @param documents 学習対象の文書配列
   * @param context 学習コンテキスト
   */
  protected logTotalDocuments(documents: Document[], context: RecommenderTrainingContext): void {
    if (context.options.debug) {
      console.log(`Total documents: ${documents.length}`);
    }
  }

  /**
   * 単一コレクションの前処理を実行する
   * @param documents 学習対象の文書配列
   * @param context 学習コンテキスト
   * @returns 前処理済み文書配列
   */
  protected async preprocessDocuments(
    documents: Document[],
    context: RecommenderTrainingContext
  ): Promise<ProcessedDocument[]> {
    return this.documentPreprocessor.preprocessDocuments(documents, context.pipeline, context.options);
  }

  /**
   * 双方向学習用の前処理を実行する
   * @param documents メインの文書配列
   * @param targetDocuments ターゲット文書配列
   * @param context 学習コンテキスト
   * @returns 前処理済み文書
   */
  protected async preprocessBidirectionalDocuments(
    documents: Document[],
    targetDocuments: Document[],
    context: RecommenderTrainingContext
  ): Promise<{ processedDocuments: ProcessedDocument[]; targetProcessedDocuments: ProcessedDocument[] }> {
    const processedDocuments = await this.documentPreprocessor.preprocessDocuments(
      documents,
      context.pipeline,
      context.options
    );
    const targetProcessedDocuments = await this.documentPreprocessor.preprocessDocuments(
      targetDocuments,
      context.pipeline,
      context.options
    );

    return {
      processedDocuments,
      targetProcessedDocuments,
    };
  }
}
