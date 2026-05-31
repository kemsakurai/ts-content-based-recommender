import {
  Document,
  ProcessedDocument,
  SimilarDocument,
} from '../../types/index.js';
import { DocumentVectorFactory } from '../factories/DocumentVectorFactory.js';
import {
  DocumentVector,
  SimilarityCalculator,
} from '../services/SimilarityCalculator.js';
import { DocumentPreprocessor } from '../services/DocumentPreprocessor.js';
import { AbstractTrainingStrategy } from './AbstractTrainingStrategy.js';
import { RecommenderTrainingContext } from './RecommenderTrainingStrategy.js';

/**
 * ベクトル系学習戦略の共通基底クラス
 */
export abstract class AbstractVectorTrainingStrategy extends AbstractTrainingStrategy {
  /** 類似度計算サービス */
  private similarityCalculator: SimilarityCalculator;

  /** 文書ベクトル生成サービス */
  protected documentVectorFactory: DocumentVectorFactory;

  /**
   * コンストラクタ
   * @param documentPreprocessor 文書前処理サービス
   * @param documentVectorFactory 文書ベクトル生成サービス
   * @param similarityCalculator 類似度計算サービス
   */
  constructor(
    documentPreprocessor: DocumentPreprocessor = new DocumentPreprocessor(),
    documentVectorFactory: DocumentVectorFactory = new DocumentVectorFactory(),
    similarityCalculator: SimilarityCalculator = new SimilarityCalculator()
  ) {
    super(documentPreprocessor);
    this.documentVectorFactory = documentVectorFactory;
    this.similarityCalculator = similarityCalculator;
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
    const documentVectors = this.createDocumentVectors(processedDocuments, context);

    return this.similarityCalculator.calculate(documentVectors, context.options);
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
    const { documentVectors, targetDocumentVectors } = this.createBidirectionalDocumentVectors(
      processedDocuments,
      targetProcessedDocuments,
      context
    );

    return this.similarityCalculator.calculateBetweenTwoVectors(
      documentVectors,
      targetDocumentVectors,
      context.options
    );
  }

  /**
   * 単一コレクション用の文書ベクトルを生成する
   * @param processedDocuments 前処理済み文書配列
   * @param context 学習コンテキスト
   * @returns 文書ベクトル配列
   */
  protected abstract createDocumentVectors(
    processedDocuments: ProcessedDocument[],
    context: RecommenderTrainingContext
  ): DocumentVector[];

  /**
   * 双方向学習用の文書ベクトルを生成する
   * @param processedDocuments メイン文書配列
   * @param targetProcessedDocuments ターゲット文書配列
   * @param context 学習コンテキスト
   * @returns 文書ベクトル配列
   */
  protected abstract createBidirectionalDocumentVectors(
    processedDocuments: ProcessedDocument[],
    targetProcessedDocuments: ProcessedDocument[],
    context: RecommenderTrainingContext
  ): { documentVectors: DocumentVector[]; targetDocumentVectors: DocumentVector[] };
}
