import {
  RecommenderOptions,
  SimilarDocument,
} from '../../types/index.js';

/**
 * 類似度結果データの構築を担当するサービス
 */
export class SimilarityResultBuilder {
  /**
   * データハッシュを初期化する
   * @param items 文書配列
   * @returns 初期化済みデータハッシュ
   */
  public initializeDataHash<T extends { id: string }>(items: T[]): Record<string, SimilarDocument[]> {
    return items.reduce((acc: Record<string, SimilarDocument[]>, item) => {
      acc[item.id] = [];
      return acc;
    }, {});
  }

  /**
   * 類似文書を降順でソートし、最大数を制限する
   * @param data 類似度データ
   * @param options 設定オプション
   */
  public orderDocuments(data: Record<string, SimilarDocument[]>, options: RecommenderOptions): void {
    Object.keys(data)
      .forEach((id) => {
        data[id].sort((a, b) => b.score - a.score);

        if (data[id].length > options.maxSimilarDocuments!) {
          data[id] = data[id].slice(0, options.maxSimilarDocuments);
        }
      });
  }
}