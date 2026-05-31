import {
  Document,
  ProcessedDocument,
  ProcessingPipeline,
  RecommenderOptions,
} from '../../types/index.js';
import { JapaneseTokenizer } from '../tokenizers/JapaneseTokenizer.js';
import { EnglishTokenFilter } from '../filters/EnglishTokenFilter.js';
import { JapaneseTokenFilter } from '../filters/JapaneseTokenFilter.js';

/**
 * 文書前処理サービス
 * トークン化とフィルタリングを担当します
 */
export class DocumentPreprocessor {
  /**
   * 文書配列を前処理する
   * @param documents 対象文書配列
   * @param pipeline 処理パイプライン
   * @param options 推薦設定
   * @returns 前処理済み文書配列
   */
  public async preprocessDocuments(
    documents: Document[],
    pipeline: ProcessingPipeline,
    options: RecommenderOptions
  ): Promise<ProcessedDocument[]> {
    if (options.debug) {
      console.log('Preprocessing documents');
    }

    if (options.language === 'ja') {
      const processedDocuments: ProcessedDocument[] = [];

      for (const document of documents) {
        processedDocuments.push(await this.preprocessDocument(document, pipeline, options));
      }

      return processedDocuments;
    }

    return Promise.all(documents.map((document) => this.preprocessDocument(document, pipeline, options)));
  }

  /**
   * 単一文書を前処理する
   * @param document 対象文書
   * @param pipeline 処理パイプライン
   * @param options 推薦設定
   * @returns 前処理済み文書
   */
  private async preprocessDocument(
    document: Document,
    pipeline: ProcessingPipeline,
    options: RecommenderOptions
  ): Promise<ProcessedDocument> {
    const title = (typeof document.title === 'string' && document.title.trim().length > 0)
      ? document.title
      : undefined;

    if (options.language === 'ja') {
      const tokens = await this.getTokensFromString(document.content, pipeline, options);
      const titleTokens = title
        ? await this.getTokensFromString(title, pipeline, options)
        : undefined;

      return {
        id: document.id,
        tokens,
        titleTokens,
        originalDocument: document,
      };
    }

    const [tokens, titleTokens] = await Promise.all([
      this.getTokensFromString(document.content, pipeline, options),
      title ? this.getTokensFromString(title, pipeline, options) : Promise.resolve(undefined)
    ]);

    return {
      id: document.id,
      tokens,
      titleTokens,
      originalDocument: document,
    };
  }

  /**
   * 文字列からトークンを抽出する
   * @param string 対象文字列
   * @param pipeline 処理パイプライン
   * @param options 推薦設定
   * @returns トークン配列
   */
  private async getTokensFromString(
    string: string,
    pipeline: ProcessingPipeline,
    options: RecommenderOptions
  ): Promise<string[]> {
    if (options.language === 'ja') {
      const japaneseTokenizer = pipeline.tokenizer as JapaneseTokenizer;
      const japaneseFilter = pipeline.filter as JapaneseTokenFilter;
      const detailedTokens = await japaneseTokenizer.getDetailedJapaneseTokens(string);
      return japaneseFilter.filterWithPos(detailedTokens);
    }

    const rawTokens = await pipeline.tokenizer.tokenize(string);

    if (options.language === 'en') {
      const englishFilter = pipeline.filter as EnglishTokenFilter;
      return englishFilter.filterWithNgrams(rawTokens);
    }

    return pipeline.filter.filter(rawTokens);
  }
}
