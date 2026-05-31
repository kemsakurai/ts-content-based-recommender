import {
  Document,
  RecommenderOptions,
} from '../../types/index.js';

/**
 * 推薦入力の検証を担当するクラス
 */
export class RecommenderValidator {
  /**
   * 設定オプションを検証する
   * @param options 設定オプション
   * @throws {Error} 無効なオプションが指定された場合
   */
  public static validateOptions(options: RecommenderOptions = {}): void {
    if ((options.maxVectorSize !== undefined) &&
      (!Number.isInteger(options.maxVectorSize) || options.maxVectorSize <= 0)) {
      throw new Error('The option maxVectorSize should be integer and greater than 0');
    }

    if ((options.maxSimilarDocuments !== undefined) &&
      (!Number.isInteger(options.maxSimilarDocuments) || options.maxSimilarDocuments <= 0)) {
      throw new Error('The option maxSimilarDocuments should be integer and greater than 0');
    }

    if ((options.minScore !== undefined) &&
      (typeof options.minScore !== 'number' || options.minScore < 0 || options.minScore > 1)) {
      throw new Error('The option minScore should be a number between 0 and 1');
    }

    if ((options.algorithm !== undefined) &&
      (typeof options.algorithm !== 'string' || !['tfidf', 'lsa', 'bm25'].includes(options.algorithm))) {
      throw new Error('The option algorithm should be either "tfidf", "lsa" or "bm25"');
    }

    if ((options.language !== undefined) &&
      (typeof options.language !== 'string' || !['en', 'ja'].includes(options.language))) {
      throw new Error('The option language should be either "en" or "ja"');
    }

    if ((options.lsaDimensions !== undefined) &&
      (!Number.isInteger(options.lsaDimensions) || options.lsaDimensions <= 0)) {
      throw new Error('The option lsaDimensions should be integer and greater than 0');
    }
  }

  /**
   * 文書配列を検証する
   * @param documents 検証対象の文書配列
   * @throws {Error} 無効な文書配列が指定された場合
   */
  public static validateDocuments(documents: Document[]): void {
    if (!Array.isArray(documents)) {
      throw new Error('Documents should be an array of objects');
    }

    for (let i = 0; i < documents.length; i += 1) {
      const document = documents[i];

      if (!Object.prototype.hasOwnProperty.call(document, 'id') ||
          !Object.prototype.hasOwnProperty.call(document, 'content')) {
        throw new Error('Documents should be have fields id and content');
      }

      if (Object.prototype.hasOwnProperty.call(document, 'tokens') ||
          Object.prototype.hasOwnProperty.call(document, 'vector')) {
        throw new Error('"tokens" and "vector" properties are reserved and cannot be used as document properties');
      }
    }
  }
}
