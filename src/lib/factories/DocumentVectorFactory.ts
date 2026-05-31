import Vector from 'vector-object';
import { Matrix, SingularValueDecomposition } from 'ml-matrix';
import natural from 'natural';
import {
  ProcessedDocument,
  RecommenderOptions,
} from '../../types/index.js';
import { DocumentVector } from '../services/SimilarityCalculator.js';

const { TfIdf } = natural;

/**
 * 文書ベクトル生成サービス
 */
export class DocumentVectorFactory {
  /**
   * TF-IDF ベースの双方向学習用文書ベクトルを生成する
   * @param processedDocuments メイン文書配列
   * @param targetProcessedDocuments ターゲット文書配列
   * @param options 設定オプション
   * @returns 文書ベクトル配列
   */
  public createBidirectionalTfIdfWordVectors(
    processedDocuments: ProcessedDocument[],
    targetProcessedDocuments: ProcessedDocument[],
    options: RecommenderOptions
  ): { documentVectors: DocumentVector[]; targetDocumentVectors: DocumentVector[] } {
    return {
      documentVectors: this.createTfIdfWordVectors(processedDocuments, options),
      targetDocumentVectors: this.createTfIdfWordVectors(targetProcessedDocuments, options)
    };
  }

  /**
   * LSA ベースの双方向学習用文書ベクトルを生成する
   * @param processedDocuments メイン文書配列
   * @param targetProcessedDocuments ターゲット文書配列
   * @param options 設定オプション
   * @returns 文書ベクトル配列
   */
  public createBidirectionalLsaWordVectors(
    processedDocuments: ProcessedDocument[],
    targetProcessedDocuments: ProcessedDocument[],
    options: RecommenderOptions
  ): { documentVectors: DocumentVector[]; targetDocumentVectors: DocumentVector[] } {
    const allDocuments = processedDocuments.concat(targetProcessedDocuments);
    const allVectors = this.createLsaWordVectors(allDocuments, options);
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
  public createTfIdfWordVectors(processedDocuments: ProcessedDocument[], options: RecommenderOptions): DocumentVector[] {
    const tfidf = new TfIdf();

    processedDocuments.forEach((processedDocument) => {
      tfidf.addDocument(processedDocument.tokens);
    });

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

      documentVectors.push({
        id: processedDocument.id,
        vector: new Vector(hash),
      });
    }

    return documentVectors;
  }

  /**
   * LSAベースの文書ベクトルを生成する
   * @param processedDocuments 前処理済み文書配列
   * @param options 設定オプション
   * @returns 文書ベクトル配列
   */
  public createLsaWordVectors(processedDocuments: ProcessedDocument[], options: RecommenderOptions): DocumentVector[] {
    if (processedDocuments.length === 0) {
      return [];
    }

    const { matrix } = this.buildTfIdfMatrix(processedDocuments);
    if (matrix.columns === 0) {
      return this.createZeroVectors(processedDocuments);
    }

    const shouldTranspose = matrix.columns > matrix.rows;
    const matrixForSvd = shouldTranspose ? matrix.transpose() : matrix;
    const svd = new SingularValueDecomposition(matrixForSvd, {
      autoTranspose: false,
    });
    const singularValues = svd.diagonal;
    if (singularValues.length === 0) {
      return this.createZeroVectors(processedDocuments);
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
  private buildTfIdfMatrix(processedDocuments: ProcessedDocument[]): { matrix: Matrix; terms: string[] } {
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
  private createZeroVectors(processedDocuments: ProcessedDocument[]): DocumentVector[] {
    return processedDocuments.map((processedDocument) => ({
      id: processedDocument.id,
      vector: new Vector({}),
    }));
  }
}
