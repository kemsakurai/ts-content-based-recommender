/**
 * プロジェクト内で使用される型定義
 */

/**
 * 文書データの基本インターフェース
 */
export interface Document {
  /** 文書の一意識別子 */
  id: string;
  /** 文書の内容 */
  content: string;
  /** その他の任意プロパティ */
  [key: string]: any;
}

/**
 * 推薦アルゴリズムの種別
 */
export type RecommenderAlgorithm = 'tfidf' | 'lsa';

/**
 * ContentBasedRecommenderの設定オプション
 */
export interface RecommenderOptions {
  /** 最大ベクトルサイズ（デフォルト: 100） */
  maxVectorSize?: number;
  /** 保持する類似文書の最大数 */
  maxSimilarDocuments?: number;
  /** 類似度の最小閾値（0-1） */
  minScore?: number;
  /** デバッグモードの有効化 */
  debug?: boolean;
  /** 推薦アルゴリズム */
  algorithm?: RecommenderAlgorithm;
  /** 使用する言語（デフォルト: 'en'、日本語: 'ja'） */
  language?: 'en' | 'ja';
  /** LSAで利用する潜在次元数 */
  lsaDimensions?: number;
  /** トークンフィルターのオプション */
  tokenFilterOptions?: TokenFilterOptions;
}

/**
 * トークンフィルターの設定オプション
 */
export interface TokenFilterOptions {
  /** 重複除去を行うかどうか（デフォルト: true） */
  removeDuplicates?: boolean;
  /** ストップワード除去を行うかどうか（デフォルト: true） */
  removeStopwords?: boolean;
  /** カスタムストップワードリスト */
  customStopWords?: string[];
  /** 最小トークン長（この長さ未満のトークンを除外） */
  minTokenLength?: number;
  /** 品詞フィルター（日本語のみ、指定した品詞のみを保持） */
  allowedPos?: string[];
}

/**
 * 類似文書の情報
 */
export interface SimilarDocument {
  /** 文書ID */
  id: string;
  /** 類似度スコア */
  score: number;
}

/**
 * 学習済みモデルのエクスポートデータ
 */
export interface ExportedModel {
  /** 設定オプション */
  options: RecommenderOptions;
  /** 類似度データ */
  data: Record<string, SimilarDocument[]>;
}

/**
 * プリプロセス済み文書データ
 */
export interface ProcessedDocument {
  /** 文書ID */
  id: string;
  /** トークン化された単語の配列 */
  tokens: string[];
  /** 元の文書データ */
  originalDocument: Document;
}

/**
 * TF-IDFの計算結果
 */
export interface TfIdfResult {
  /** 単語 */
  term: string;
  /** TF-IDF値 */
  tfidf: number;
  /** 文書ID */
  documentId: string;
}

/**
 * トークナイザーインターフェース
 */
export interface ITokenizer {
  /**
   * テキストをトークン化する
   * @param text 対象テキスト
   * @returns トークン配列
   */
  tokenize(text: string): Promise<string[]>;
}

/**
 * 日本語の詳細トークン情報
 */
export interface DetailedJapaneseToken {
  /** 品詞 */
  pos: string;
  /** 表層形 */
  surface_form: string;
  /** 基本形 */
  basic_form?: string;
}

/**
 * トークンフィルターインターフェース
 */
export interface ITokenFilter {
  /**
   * トークン配列をフィルタリングする
   * @param tokens フィルタリング対象のトークン配列
   * @returns フィルタリング済みトークン配列
   */
  filter(tokens: string[]): string[];
}

/**
 * 英語専用トークンフィルターインターフェース
 */
export interface IEnglishTokenFilter extends ITokenFilter {
  /**
   * N-gram対応フィルタリング（英語用）
   * @param tokens トークン配列
   * @returns フィルタリング済みトークン配列
   */
  filterWithNgrams(tokens: string[]): string[];
}

/**
 * 日本語専用トークンフィルターインターフェース
 */
export interface IJapaneseTokenFilter extends ITokenFilter {
  /**
   * 品詞情報を使用したフィルタリング（日本語用）
   * @param tokens 品詞情報付きトークン配列
   * @returns フィルタリング済みトークン配列
   */
  filterWithPos(tokens: DetailedJapaneseToken[]): string[];
}

/**
 * 処理パイプライン
 */
export interface ProcessingPipeline {
  /** トークナイザー */
  tokenizer: ITokenizer;
  /** トークンフィルター */
  filter: ITokenFilter;
}
