import Vector from 'vector-object';
import {
  RecommenderOptions,
  SimilarDocument,
} from '../../types/index.js';
import { SimilarityResultBuilder } from './SimilarityResultBuilder.js';

/**
 * 文書ベクトルインターフェース
 */
export interface DocumentVector {
  /** 文書ID */
  id: string;
  /** ベクトルオブジェクト */
  vector: Vector;
}

/**
 * ベクトル類似度計算サービス
 */
export class SimilarityCalculator {
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
   * 2つのベクトル集合の類似度を計算する
   * @param documentVectors メイン文書ベクトル
   * @param targetDocumentVectors ターゲット文書ベクトル
   * @param options 設定オプション
   * @returns 類似度データ
   */
  public calculateBetweenTwoVectors(
    documentVectors: DocumentVector[],
    targetDocumentVectors: DocumentVector[],
    options: RecommenderOptions
  ): Record<string, SimilarDocument[]> {
    const data = {
      ...this.similarityResultBuilder.initializeDataHash(documentVectors),
      ...this.similarityResultBuilder.initializeDataHash(targetDocumentVectors)
    };

    for (let i = 0; i < documentVectors.length; i += 1) {
      if (options.debug) console.log(`Calculating similarity score for document ${i}`);

      for (let j = 0; j < targetDocumentVectors.length; j += 1) {
        const documentVectorA = documentVectors[i];
        const documentVectorB = targetDocumentVectors[j];
        const idi = documentVectorA.id;
        const vi = documentVectorA.vector;
        const idj = documentVectorB.id;
        const vj = documentVectorB.vector;
        const similarity = this.getCosineSimilarity(vi, vj);

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

    this.similarityResultBuilder.orderDocuments(data, options);

    return data;
  }

  /**
   * 同一コレクション内の類似度を計算する
   * @param documentVectors 文書ベクトル配列
   * @param options 設定オプション
   * @returns 類似度データ
   */
  public calculate(
    documentVectors: DocumentVector[],
    options: RecommenderOptions
  ): Record<string, SimilarDocument[]> {
    const data = { ...this.similarityResultBuilder.initializeDataHash(documentVectors) };

    for (let i = 0; i < documentVectors.length; i += 1) {
      if (options.debug) console.log(`Calculating similarity score for document ${i}`);

      for (let j = 0; j < i; j += 1) {
        const documentVectorA = documentVectors[i];
        const idi = documentVectorA.id;
        const vi = documentVectorA.vector;
        const documentVectorB = documentVectors[j];
        const idj = documentVectorB.id;
        const vj = documentVectorB.vector;
        const similarity = this.getCosineSimilarity(vi, vj);

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

    this.similarityResultBuilder.orderDocuments(data, options);

    return data;
  }

  /**
   * コサイン類似度を安全に取得する
   * @param vectorA ベクトルA
   * @param vectorB ベクトルB
   * @returns コサイン類似度
   */
  public getCosineSimilarity(vectorA: Vector, vectorB: Vector): number {
    const similarity = vectorA.getCosineSimilarity(vectorB);
    return Number.isFinite(similarity) ? similarity : 0;
  }
}
