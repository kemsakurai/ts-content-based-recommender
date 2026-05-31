import { ProcessedDocument } from '../../types/index.js';
import { DocumentVector } from '../services/SimilarityCalculator.js';
import { AbstractVectorTrainingStrategy } from './AbstractVectorTrainingStrategy.js';
import {
  RecommenderTrainingContext,
  RecommenderTrainingStrategyMetadata,
} from './RecommenderTrainingStrategy.js';

/** LSA 学習戦略メタデータ */
export const lsaTrainingStrategyMetadata: RecommenderTrainingStrategyMetadata = {};

/**
 * LSA 学習戦略
 */
export class LsaTrainingStrategy extends AbstractVectorTrainingStrategy {
  /**
   * 単一コレクション用の文書ベクトルを生成する
   * @param processedDocuments 前処理済み文書配列
   * @param context 学習コンテキスト
   * @returns 文書ベクトル配列
   */
  protected createDocumentVectors(
    processedDocuments: ProcessedDocument[],
    context: RecommenderTrainingContext
  ): DocumentVector[] {
    return this.documentVectorFactory.createLsaWordVectors(processedDocuments, context.options);
  }

  /**
   * 双方向学習用の文書ベクトルを生成する
   * @param processedDocuments メイン文書配列
   * @param targetProcessedDocuments ターゲット文書配列
   * @param context 学習コンテキスト
   * @returns 文書ベクトル配列
   */
  protected createBidirectionalDocumentVectors(
    processedDocuments: ProcessedDocument[],
    targetProcessedDocuments: ProcessedDocument[],
    context: RecommenderTrainingContext
  ): { documentVectors: DocumentVector[]; targetDocumentVectors: DocumentVector[] } {
    return this.documentVectorFactory.createBidirectionalLsaWordVectors(
      processedDocuments,
      targetProcessedDocuments,
      context.options
    );
  }
}
