import * as sw from 'stopword';
import { IEnglishTokenFilter, TokenFilterOptions } from '../../types/index.js';

/**
 * 英語専用トークンフィルタークラス
 * ストップワード除去、重複除去、長さフィルタリング、N-gram対応等を行います
 */
export class EnglishTokenFilter implements IEnglishTokenFilter {
  /** フィルターオプション */
  private options: Required<TokenFilterOptions>;

  /** 英語デフォルトストップワード */
  private static readonly DEFAULT_STOPWORDS = [
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
    'in', 'with', 'to', 'for', 'of', 'as', 'by'
  ];

  /**
   * コンストラクタ
   * @param options フィルターオプション
   */
  constructor(options: TokenFilterOptions = {}) {
    this.options = {
      removeDuplicates: options.removeDuplicates ?? true,
      removeStopwords: options.removeStopwords ?? true,
      customStopWords: options.customStopWords ?? [],
      minTokenLength: options.minTokenLength ?? 1,
      allowedPos: options.allowedPos ?? [] // 英語フィルターでは使用しない
    };
  }

  /**
   * トークン配列をフィルタリングする
   * @param tokens フィルタリング対象のトークン配列
   * @returns フィルタリング済みトークン配列
   */
  public filter(tokens: string[]): string[] {
    let filteredTokens = tokens;

    // 長さフィルタリング
    if (this.options.minTokenLength > 1) {
      filteredTokens = this._filterByLength(filteredTokens);
    }

    // ストップワード除去
    if (this.options.removeStopwords) {
      filteredTokens = this._removeStopwords(filteredTokens);
    }

    // 重複除去
    if (this.options.removeDuplicates) {
      filteredTokens = this._removeDuplicates(filteredTokens);
    }

    return filteredTokens;
  }

  /**
   * N-gram対応フィルタリング（英語用）
   * ストップワードを含むN-gramを除去します
   * @param tokens トークン配列
   * @returns フィルタリング済みトークン配列
   */
  public filterWithNgrams(tokens: string[]): string[] {
    let filteredTokens = tokens;

    // 長さフィルタリング
    if (this.options.minTokenLength > 1) {
      filteredTokens = this._filterByLength(filteredTokens);
    }

    // N-gramのストップワードフィルタリング
    if (this.options.removeStopwords) {
      filteredTokens = this._filterNgramsWithStopwords(filteredTokens);
    }

    // 重複除去
    if (this.options.removeDuplicates) {
      filteredTokens = this._removeDuplicates(filteredTokens);
    }

    return filteredTokens;
  }

  /**
   * 長さによるフィルタリング
   * @param tokens トークン配列
   * @returns フィルタリング済みトークン配列
   */
  private _filterByLength(tokens: string[]): string[] {
    return tokens.filter(token => token.length >= this.options.minTokenLength);
  }

  /**
   * ストップワード除去（英語用）
   * @param tokens トークン配列
   * @returns ストップワード除去済みトークン配列
   */
  private _removeStopwords(tokens: string[]): string[] {
    // stopwordライブラリを使用した後、カスタムストップワードも除去
    let filteredTokens = sw.removeStopwords(tokens);

    if (this.options.customStopWords.length > 0) {
      const customStopWords = new Set([
        ...EnglishTokenFilter.DEFAULT_STOPWORDS,
        ...this.options.customStopWords
      ]);
      filteredTokens = filteredTokens.filter(token => !customStopWords.has(token));
    }

    return filteredTokens;
  }

  /**
   * N-gramのストップワードフィルタリング（英語用）
   * @param tokens トークン配列
   * @returns フィルタリング済みトークン配列
   */
  private _filterNgramsWithStopwords(tokens: string[]): string[] {
    const filteredTokens: string[] = [];

    for (const token of tokens) {
      if (token.includes('_')) {
        // N-gramの場合、ストップワードを含むかチェック
        const tokenParts = token.split('_');
        if (tokenParts.length === sw.removeStopwords(tokenParts).length) {
          filteredTokens.push(token);
        }
      } else {
        // ユニグラムの場合、通常のストップワード除去
        const removed = sw.removeStopwords([token]);
        if (removed.length > 0) {
          filteredTokens.push(token);
        }
      }
    }

    return filteredTokens;
  }

  /**
   * 重複除去
   * @param tokens トークン配列
   * @returns 重複除去済みトークン配列
   */
  private _removeDuplicates(tokens: string[]): string[] {
    return Array.from(new Set(tokens));
  }
}
