import {
  RecommenderOptions,
  TokenFilterOptions,
} from '../../types/index.js';
import { TrainingStrategyFactory } from '../factories/TrainingStrategyFactory.js';

/**
 * デフォルト設定オプション
 */
export const defaultRecommenderOptions: RecommenderOptions = {
  maxVectorSize: 100,
  maxSimilarDocuments: Number.MAX_SAFE_INTEGER,
  minScore: 0,
  debug: false,
  algorithm: 'tfidf',
  language: 'en',
  lsaDimensions: 12,
  tokenFilterOptions: {
    removeDuplicates: true,
    removeStopwords: true,
    customStopWords: [],
    minTokenLength: 1,
    allowedPos: ['名詞', '動詞', '形容詞']
  }
};

/**
 * 推薦設定の解決を担当するクラス
 */
export class RecommenderOptionsResolver {
  /**
   * 設定オプションを解決する
   * @param options 指定オプション
   * @returns 解決済みオプション
   */
  public static resolveOptions(options: RecommenderOptions): RecommenderOptions {
    const algorithm = options.algorithm ?? defaultRecommenderOptions.algorithm;
    const strategyMetadata = TrainingStrategyFactory.getMetadata(algorithm);

    return Object.assign({}, defaultRecommenderOptions, strategyMetadata.optionDefaults, options, {
      tokenFilterOptions: this.resolveTokenFilterOptions(
        options.tokenFilterOptions,
        strategyMetadata.tokenFilterOptionsDefaults
      ),
    });
  }

  /**
   * トークンフィルターの設定を解決する
   * @param tokenFilterOptions 指定オプション
   * @param algorithm 推薦アルゴリズム
   * @returns 解決済みフィルターオプション
   */
  private static resolveTokenFilterOptions(
    tokenFilterOptions: TokenFilterOptions = {},
    strategyTokenFilterDefaults: TokenFilterOptions = {}
  ): TokenFilterOptions {
    return Object.assign(
      {},
      defaultRecommenderOptions.tokenFilterOptions,
      strategyTokenFilterDefaults,
      tokenFilterOptions
    );
  }
}
