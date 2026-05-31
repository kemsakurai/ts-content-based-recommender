import {
  Document,
  RecommenderOptions,
  SimilarDocument,
  ExportedModel,
  ProcessingPipeline,
} from '../types/index.js';
import { ProcessingPipelineFactory } from './factories/ProcessingPipelineFactory.js';
import { TrainingStrategyFactory } from './factories/TrainingStrategyFactory.js';
import { RecommenderOptionsResolver } from './services/RecommenderOptionsResolver.js';
import { RecommenderValidator } from './services/RecommenderValidator.js';
import { RecommenderTrainingContext } from './strategies/RecommenderTrainingStrategy.js';

/**
 * コンテンツベース推薦システムのメインクラス
 * TF-IDFとコサイン類似度を使用して文書間の類似性を計算し、類似したアイテムを推薦します
 */
class ContentBasedRecommender {
  /** 推薦システムの設定オプション */
  private options: RecommenderOptions;

  /** 文書間の類似度データ */
  private data: Record<string, SimilarDocument[]>;

  /** 処理パイプライン（トークナイザー + フィルター） */
  private pipeline: ProcessingPipeline;

  /**
   * ContentBasedRecommenderのコンストラクタ
   * @param options 推薦システムの設定オプション
   */
  constructor(options: RecommenderOptions = {}) {
    this.setOptions(options);
    this.data = {};

    // 処理パイプラインの初期化
    this.pipeline = ProcessingPipelineFactory.createPipeline(this.options.language!, this.options.tokenFilterOptions);
  }

  /**
   * 設定オプションを設定・検証する
   * @param options 設定オプション
   * @throws {Error} 無効なオプションが指定された場合
   */
  public setOptions(options: RecommenderOptions = {}): void {
    RecommenderValidator.validateOptions(options);

    const prevLanguage = this.options?.language;
    const prevTokenFilterOptions = this.options?.tokenFilterOptions;
    this.options = RecommenderOptionsResolver.resolveOptions(options);

    // 言語またはフィルター条件が変更された場合、処理パイプラインを再初期化
    if (this.pipeline && (
      prevLanguage !== this.options.language ||
      JSON.stringify(prevTokenFilterOptions) !== JSON.stringify(this.options.tokenFilterOptions)
    )) {
      this.pipeline = ProcessingPipelineFactory.createPipeline(this.options.language!, this.options.tokenFilterOptions);
    }
  }

  /**
   * 単一コレクションの文書を学習する
   * @param documents 学習対象の文書配列
   */
  public async train(documents: Document[]): Promise<void> {
    this.validateDocuments(documents);
    const trainingStrategy = TrainingStrategyFactory.create(this.options.algorithm);
    this.data = await trainingStrategy.train(documents, this.createTrainingContext());
  }

  /**
   * 双方向学習（異なるコレクション間の類似度計算）
   * @param documents メインの文書配列
   * @param targetDocuments ターゲット文書配列
   */
  public async trainBidirectional(documents: Document[], targetDocuments: Document[]): Promise<void> {
    this.validateDocuments(documents);
    this.validateDocuments(targetDocuments);
    const trainingStrategy = TrainingStrategyFactory.create(this.options.algorithm);
    this.data = await trainingStrategy.trainBidirectional(documents, targetDocuments, this.createTrainingContext());
  }

  /**
   * 文書配列のバリデーション
   * @param documents 検証対象の文書配列
   * @throws {Error} 無効な文書配列が指定された場合
   */
  public validateDocuments(documents: Document[]): void {
    RecommenderValidator.validateDocuments(documents);
  }

  /**
   * 指定IDの類似文書を取得する
   * @param id 文書ID
   * @param start 開始インデックス（デフォルト: 0）
   * @param size 取得サイズ（未指定の場合は全て）
   * @returns 類似文書の配列
   */
  public getSimilarDocuments(id: string, start: number = 0, size?: number): SimilarDocument[] {
    let similarDocuments = this.data[id];

    if (similarDocuments === undefined) {
      return [];
    }

    const end = (size !== undefined) ? start + size : undefined;
    similarDocuments = similarDocuments.slice(start, end);

    return similarDocuments;
  }

  /**
   * 学習済みモデルをエクスポートする
   * @returns エクスポートデータ
   */
  public export(): Partial<ExportedModel> {
    return {
      options: this.options,
      data: this.data,
    };
  }

  /**
   * エクスポートされたモデルをインポートする
   * @param object インポートするモデルデータ
   */
  public import(object: Partial<ExportedModel>): void {
    const { options, data } = object;

    if (options) {
      this.setOptions(options);
    }
    if (data) {
      this.data = data;
    }
  }

  // プライベートメソッド

  /**
   * 学習戦略向けの実行コンテキストを生成する
   * @returns 学習コンテキスト
   */
  private createTrainingContext(): RecommenderTrainingContext {
    return {
      options: this.options,
      pipeline: this.pipeline,
    };
  }
}

export default ContentBasedRecommender;
