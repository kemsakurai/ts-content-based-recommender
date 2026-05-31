import kuromoji from 'kuromoji';
import striptags from 'striptags';
import { ITokenizer, DetailedJapaneseToken } from '../../types/index.js';

/**
 * 日本語テキスト用のトークナイザークラス
 * kuromojiを使用した形態素解析でトークン化を行います
 */
export class JapaneseTokenizer implements ITokenizer {
  /** kuromoji形態素解析器 */
  private kuromojiTokenizer?: kuromoji.Tokenizer<kuromoji.IpadicFeatures>;

  /**
   * 日本語テキストをトークン化する
   * @param text 対象テキスト
   * @returns トークン配列のPromise
   */
  public async tokenize(text: string): Promise<string[]> {
    const kuromojiTokens = await this.getDetailedTokens(text);

    // 基本形が'*'の場合は表層形を使用
    return kuromojiTokens.map((token) => {
      const baseForm = token.basic_form;
      return (baseForm && baseForm !== '*') ? baseForm : token.surface_form;
    });
  }

  /**
   * kuromoji形態素解析器を初期化する
   * @returns Promise<void>
   */
  private async _initializeKuromojiTokenizer(): Promise<void> {
    if (this.kuromojiTokenizer) {
      return; // 既に初期化済みの場合は何もしない
    }

    return new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
        if (err) {
          reject(err);
        } else {
          this.kuromojiTokenizer = tokenizer;
          resolve();
        }
      });
    });
  }

  /**
   * 形態素解析結果の詳細情報を取得する
   * @param text 対象テキスト
   * @returns 形態素解析結果のPromise
   */
  public async getDetailedTokens(text: string): Promise<kuromoji.IpadicFeatures[]> {
    if (!this.kuromojiTokenizer) {
      await this._initializeKuromojiTokenizer();
    }

    if (!this.kuromojiTokenizer) {
      throw new Error('Failed to initialize kuromoji tokenizer');
    }

    // HTMLタグの除去
    const cleanText = striptags(text, [], ' ').trim();

    // 空文字列の場合は空配列を返す
    if (!cleanText) {
      return [];
    }

    // 形態素解析を実行
    return this.kuromojiTokenizer.tokenize(cleanText);
  }

  /**
   * 詳細な形態素解析結果を取得する（DetailedJapaneseToken形式）
   * @param text 解析対象のテキスト
   * @returns DetailedJapaneseToken形式の解析結果のPromise
   */
  public async getDetailedJapaneseTokens(text: string): Promise<DetailedJapaneseToken[]> {
    const kuromojiTokens = await this.getDetailedTokens(text);

    return kuromojiTokens.map((token) => ({
      pos: token.pos,
      surface_form: token.surface_form,
      basic_form: token.basic_form,
    }));
  }
}
