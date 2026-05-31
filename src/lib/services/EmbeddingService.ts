// @ts-ignore — @xenova/transformers は ESM パッケージのため動的インポートで読み込む
import type { FeatureExtractionPipeline } from '@xenova/transformers';

/** デフォルトの埋め込みモデル名 */
const DEFAULT_MODEL = 'Xenova/multilingual-e5-small';

/**
 * Wasm (ONNX) を使いローカルで埋め込みベクトルを生成するサービス。
 * パイプラインはモデルごとに Singleton として遅延初期化する。
 */
export class EmbeddingService {
  /** モデル名 → パイプラインのキャッシュ */
  private static pipelineCache: Map<string, FeatureExtractionPipeline> = new Map();

  /**
   * パイプラインを取得する（初回は初期化する）
   * @param model モデル名
   * @returns FeatureExtractionPipeline
   */
  private static async getPipeline(model: string): Promise<FeatureExtractionPipeline> {
    if (!this.pipelineCache.has(model)) {
      // ESM パッケージを動的インポートする
      const { pipeline } = await import('@xenova/transformers');
      const pipe = await pipeline('feature-extraction', model) as FeatureExtractionPipeline;
      this.pipelineCache.set(model, pipe);
    }

    return this.pipelineCache.get(model)!;
  }

  /**
   * テキスト配列を埋め込みベクトルに変換する。
   * 返却されるベクトルはL2正規化済みのため、dot product でコサイン類似度を計算できる。
   * @param texts 埋め込み対象のテキスト配列
   * @param model 使用するモデル名（デフォルト: Xenova/multilingual-e5-small）
   * @returns 各テキストに対応する Float32Array の配列
   */
  public static async embed(texts: string[], model: string = DEFAULT_MODEL): Promise<Float32Array[]> {
    const pipe = await this.getPipeline(model);
    const results: Float32Array[] = [];

    for (const text of texts) {
      // mean pooling + L2 正規化でセンテンス埋め込みを取得する
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      results.push(output.data as Float32Array);
    }

    return results;
  }

  /**
   * テスト用にパイプラインキャッシュをクリアする
   */
  public static clearCache(): void {
    this.pipelineCache.clear();
  }
}
