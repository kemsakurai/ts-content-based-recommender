import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ContentBasedRecommender from '../src/lib/ContentBasedRecommender.js';
import { Document, RecommenderAlgorithm } from '../src/types/index.js';
import evaluationEnDocuments from '../fixtures/evaluation-en-documents.js';
import evaluationJaMixedDocuments from '../fixtures/evaluation-ja-mixed-documents.js';

interface EvaluationDocument extends Document {
  category: string;
  tags: string[];
}

interface AccuracyMetrics {
  precisionAt5: number;
  recallAt5: number;
  averageTagOverlapAt5: number;
}

interface WarmInferenceMetrics {
  averageMs: number;
  p95Ms: number;
}

interface BenchmarkResult extends AccuracyMetrics {
  dataset: string;
  algorithm: RecommenderAlgorithm;
  documents: number;
  trainMs: number;
  warmInferenceAverageMs: number;
  warmInferenceP95Ms: number;
  rssMb: number;
  rssDeltaMb: number;
}

const TOP_K = 5;
const LSA_DIMENSIONS = 12;
const WARM_INFERENCE_ITERATIONS = 500;
const execFileAsync = promisify(execFile);
const datasets = {
  'evaluation-en': {
    name: 'evaluation-en',
    language: 'en' as const,
    documents: evaluationEnDocuments as EvaluationDocument[],
  },
  'evaluation-ja-mixed': {
    name: 'evaluation-ja-mixed',
    language: 'ja' as const,
    documents: evaluationJaMixedDocuments as EvaluationDocument[],
  },
};

/**
 * ミリ秒を丸める
 * @param value 対象値
 * @returns 小数第3位までに丸めた値
 */
function roundMetric(value: number): number {
  return Number(value.toFixed(3));
}

/**
 * ミリ秒を高精度で丸める
 * @param value 対象値
 * @returns 小数第6位までに丸めた値
 */
function roundFineMetric(value: number): number {
  return Number(value.toFixed(6));
}

/**
 * 高精度な現在時刻をミリ秒で取得する
 * @returns 現在時刻のミリ秒
 */
function nowMs(): number {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

/**
 * 関連文書を取得する
 * @param sourceDocument 基準文書
 * @param documents 対象文書配列
 * @returns 関連文書配列
 */
function getRelevantDocuments(sourceDocument: EvaluationDocument, documents: EvaluationDocument[]): EvaluationDocument[] {
  return documents.filter((document) => document.id !== sourceDocument.id && document.category === sourceDocument.category);
}

/**
 * タグの重なり率を計算する
 * @param sourceDocument 基準文書
 * @param recommendedDocument 推薦文書
 * @returns タグ重なり率
 */
function getTagOverlapRatio(sourceDocument: EvaluationDocument, recommendedDocument: EvaluationDocument): number {
  const sourceTags = new Set(sourceDocument.tags);
  const recommendedTags = new Set(recommendedDocument.tags);
  const union = new Set([...sourceTags, ...recommendedTags]);
  const intersectionCount = Array.from(sourceTags).filter((tag) => recommendedTags.has(tag)).length;

  if (union.size === 0) {
    return 0;
  }

  return intersectionCount / union.size;
}

/**
 * 推薦精度を評価する
 * @param recommender 推薦器
 * @param documents 評価文書配列
 * @returns 精度指標
 */
function evaluateAccuracy(
  recommender: ContentBasedRecommender,
  documents: EvaluationDocument[]
): AccuracyMetrics {
  const documentMap = new Map(documents.map((document) => [document.id, document]));

  const totals = documents.reduce((acc, sourceDocument) => {
    const recommendations = recommender.getSimilarDocuments(sourceDocument.id, 0, TOP_K);
    const relevantDocuments = getRelevantDocuments(sourceDocument, documents);
    const recommendedDocuments = recommendations
      .map((recommendation) => documentMap.get(recommendation.id))
      .filter((document): document is EvaluationDocument => document !== undefined);
    const relevantRecommendationCount = recommendedDocuments
      .filter((document) => document.category === sourceDocument.category)
      .length;
    const tagOverlap = recommendedDocuments.reduce((overlapAcc, recommendedDocument) => (
      overlapAcc + getTagOverlapRatio(sourceDocument, recommendedDocument)
    ), 0);

    acc.precision += relevantRecommendationCount / TOP_K;
    acc.recall += relevantDocuments.length === 0 ? 0 : relevantRecommendationCount / relevantDocuments.length;
    acc.tagOverlap += recommendedDocuments.length === 0 ? 0 : tagOverlap / recommendedDocuments.length;

    return acc;
  }, {
    precision: 0,
    recall: 0,
    tagOverlap: 0,
  });

  return {
    precisionAt5: roundMetric(totals.precision / documents.length),
    recallAt5: roundMetric(totals.recall / documents.length),
    averageTagOverlapAt5: roundMetric(totals.tagOverlap / documents.length),
  };
}

/**
 * ウォーム状態での推薦取得時間を計測する
 * @param recommender 推薦器
 * @param documents 評価文書配列
 * @returns 推論指標
 */
function evaluateWarmInference(
  recommender: ContentBasedRecommender,
  documents: EvaluationDocument[]
): WarmInferenceMetrics {
  const durations = documents.map((document) => {
    const start = nowMs();
    for (let index = 0; index < WARM_INFERENCE_ITERATIONS; index += 1) {
      recommender.getSimilarDocuments(document.id, 0, TOP_K);
    }
    return (nowMs() - start) / WARM_INFERENCE_ITERATIONS;
  }).sort((left, right) => left - right);
  const p95Index = Math.min(durations.length - 1, Math.ceil(durations.length * 0.95) - 1);
  const totalDuration = durations.reduce((acc, duration) => acc + duration, 0);

  return {
    averageMs: roundFineMetric(totalDuration / durations.length),
    p95Ms: roundFineMetric(durations[p95Index]),
  };
}

/**
 * 単一シナリオを計測する
 * @param datasetName データセット名
 * @param algorithm 推薦アルゴリズム
 * @returns ベンチ結果
 */
async function benchmarkScenario(datasetName: keyof typeof datasets, algorithm: RecommenderAlgorithm): Promise<BenchmarkResult> {
  const dataset = datasets[datasetName];
  const { documents, language } = dataset;
  const beforeRss = process.memoryUsage().rss;
  const recommender = new ContentBasedRecommender({
    algorithm,
    language,
    lsaDimensions: LSA_DIMENSIONS,
    maxSimilarDocuments: TOP_K,
    minScore: 0,
  });

  const trainingStart = nowMs();
  await recommender.train(documents);
  const trainMs = nowMs() - trainingStart;
  const afterRss = process.memoryUsage().rss;

  const accuracy = evaluateAccuracy(recommender, documents);
  const warmInference = evaluateWarmInference(recommender, documents);

  return {
    dataset: datasetName,
    algorithm,
    documents: documents.length,
    trainMs: roundMetric(trainMs),
    warmInferenceAverageMs: warmInference.averageMs,
    warmInferenceP95Ms: warmInference.p95Ms,
    rssMb: roundMetric(afterRss / (1024 * 1024)),
    rssDeltaMb: roundMetric((afterRss - beforeRss) / (1024 * 1024)),
    precisionAt5: accuracy.precisionAt5,
    recallAt5: accuracy.recallAt5,
    averageTagOverlapAt5: accuracy.averageTagOverlapAt5,
  };
}

/**
 * CLIオプションの値を取得する
 * @param flag オプション名
 * @returns オプション値
 */
function getCliOption(flag: string): string | undefined {
  const optionIndex = process.argv.indexOf(flag);
  if (optionIndex === -1) {
    return undefined;
  }

  return process.argv[optionIndex + 1];
}

/**
 * 全シナリオのベンチマークを実行する
 * @returns Promise<void>
 */
async function runAllBenchmarks(): Promise<void> {
  // embedding シナリオはローカルでモデルがキャッシュ済みの場合のみ実行する
  const scenarios: Array<{ dataset: keyof typeof datasets; algorithm: RecommenderAlgorithm }> = [
    { dataset: 'evaluation-en', algorithm: 'tfidf' },
    { dataset: 'evaluation-en', algorithm: 'lsa' },
    { dataset: 'evaluation-en', algorithm: 'bm25' },
    { dataset: 'evaluation-en', algorithm: 'embedding' },
    { dataset: 'evaluation-ja-mixed', algorithm: 'tfidf' },
    { dataset: 'evaluation-ja-mixed', algorithm: 'lsa' },
    { dataset: 'evaluation-ja-mixed', algorithm: 'bm25' },
    { dataset: 'evaluation-ja-mixed', algorithm: 'embedding' },
  ];
  const results: BenchmarkResult[] = [];

  for (const scenario of scenarios) {
    const { stdout } = await execFileAsync(process.execPath, [
      '--loader',
      'ts-node/esm',
      'benchmark/lsa-comparison.ts',
      '--dataset',
      scenario.dataset,
      '--algorithm',
      scenario.algorithm,
    ], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024,
    });
    const lines = stdout.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    results.push(JSON.parse(jsonLine) as BenchmarkResult);
  }

  console.log('Recommender benchmark results');
  console.table(results.map((result) => ({
    dataset: result.dataset,
    algorithm: result.algorithm,
    documents: result.documents,
    trainMs: result.trainMs,
    warmInferenceAverageMs: result.warmInferenceAverageMs,
    warmInferenceP95Ms: result.warmInferenceP95Ms,
    rssMb: result.rssMb,
    rssDeltaMb: result.rssDeltaMb,
    precisionAt5: result.precisionAt5,
    recallAt5: result.recallAt5,
    averageTagOverlapAt5: result.averageTagOverlapAt5,
  })));
}

/**
 * ベンチマークを実行する
 * @returns Promise<void>
 */
async function main(): Promise<void> {
  const datasetName = getCliOption('--dataset') as keyof typeof datasets | undefined;
  const algorithm = getCliOption('--algorithm') as RecommenderAlgorithm | undefined;

  if (datasetName && algorithm) {
    const result = await benchmarkScenario(datasetName, algorithm);
    console.log(JSON.stringify(result));
    return;
  }

  await runAllBenchmarks();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
