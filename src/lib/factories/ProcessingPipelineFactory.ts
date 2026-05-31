import { ProcessingPipeline, TokenFilterOptions, ITokenizer } from '../../types/index.js';
import { EnglishTokenizer } from '../tokenizers/EnglishTokenizer.js';
import { JapaneseTokenizer } from '../tokenizers/JapaneseTokenizer.js';
import { EnglishTokenFilter } from '../filters/EnglishTokenFilter.js';
import { JapaneseTokenFilter } from '../filters/JapaneseTokenFilter.js';

/**
 * 処理パイプラインファクトリークラス
 * 言語に応じてトークナイザーとフィルターを作成し、統一されたパイプラインを提供します
 */
export class ProcessingPipelineFactory {
  /**
   * 言語に応じたトークナイザーを作成する
   * @param language 対象言語
   * @returns トークナイザーインスタンス
   */
  public static createTokenizer(language: 'en' | 'ja'): ITokenizer {
    switch (language) {
      case 'en':
        return new EnglishTokenizer();
      case 'ja':
        return new JapaneseTokenizer();
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  /**
   * 言語に応じた処理パイプラインを作成する
   * @param language 対象言語 ('en' | 'ja')
   * @param filterOptions フィルターオプション
   * @returns 処理パイプライン
   */
  public static createPipeline(
    language: 'en' | 'ja' = 'en',
    filterOptions: TokenFilterOptions = {}
  ): ProcessingPipeline {
    switch (language) {
      case 'ja':
        return {
          tokenizer: this.createTokenizer('ja'),
          filter: new JapaneseTokenFilter(filterOptions),
        };
      case 'en':
      default:
        return {
          tokenizer: this.createTokenizer('en'),
          filter: new EnglishTokenFilter(filterOptions),
        };
    }
  }
}
