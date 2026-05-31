import { Document } from '../src/types/index.js';

/**
 * 評価用の日英混在文書データ
 * - language: 'ja' での評価を想定（日英混在）
 * - 代理ラベルとして category/tags を持つ
 */
export interface EvaluationMixedDocument extends Document {
  /** 代理ラベル用カテゴリ */
  category: string;
  /** 代理ラベル用タグ */
  tags: string[];
  /** この文書セットの想定言語スコープ */
  languageScope: 'en' | 'ja';
}

interface TopicTemplate {
  category: string;
  tags: string[];
  contents: string[];
}

const jaMixedTopicTemplates: TopicTemplate[] = [
  {
    category: 'ai-fundamentals',
    tags: ['ai', '人工知能', 'machine-learning'],
    contents: [
      'AI導入の最初の一歩と小さく始めるための設計ポイント',
      'Machine learning project planning for small product teams',
      '人工知能の基礎概念をプロダクトマネージャー向けに解説する',
      'How to define success metrics for an AI feature release',
      '教師あり学習と教師なし学習の違いを実務例で比較する',
      'Evaluating model quality with practical baseline strategies'
    ]
  },
  {
    category: 'nlp',
    tags: ['nlp', '自然言語処理', 'text-mining'],
    contents: [
      '自然言語処理におけるトークン化と前処理の実践',
      'Text normalization techniques for multilingual user input',
      '形態素解析とステミングの使い分けで精度を改善する',
      'Entity extraction workflow for support ticket automation',
      '日英混在テキストの類似度計算で起きる失敗パターン',
      'Lightweight sentiment analysis for customer feedback loops'
    ]
  },
  {
    category: 'web-frontend',
    tags: ['frontend', 'フロントエンド', 'react'],
    contents: [
      'Reactアプリの描画最適化と再レンダリング削減の基本',
      'Frontend accessibility improvements for enterprise dashboards',
      'デザインシステムを壊さないコンポーネント分割戦略',
      'Performance budget planning for modern web interfaces',
      'フロントエンド監視で見るべき主要なUXメトリクス',
      'State management trade offs in large single page applications'
    ]
  },
  {
    category: 'web-backend',
    tags: ['backend', 'バックエンド', 'nodejs'],
    contents: [
      'Node.jsバックエンドでのエラーハンドリング設計',
      'API versioning strategy for long lived client integrations',
      '分散トレーシングを使った障害切り分けの実践手順',
      'Caching policy design for read heavy service endpoints',
      'データ整合性を守るトランザクション設計の勘所',
      'Rate limiting and abuse prevention for public APIs'
    ]
  },
  {
    category: 'data-engineering',
    tags: ['data', 'データ基盤', 'etl'],
    contents: [
      'データ基盤におけるETLジョブの再実行戦略と冪等性',
      'Incremental pipeline design for near real time analytics',
      'スキーマ変更時に下流影響を最小化する運用方法',
      'Data quality assertions to catch silent corruption early',
      'イベントログのパーティション設計とクエリ最適化',
      'Practical data contract templates between product teams'
    ]
  },
  {
    category: 'security',
    tags: ['security', 'セキュリティ', 'auth'],
    contents: [
      'セキュリティレビューを開発プロセスに組み込む方法',
      'Authentication hardening patterns for internal admin tools',
      '秘密情報の管理とローテーションを自動化する設計',
      'Threat modeling checklist for new feature launches',
      '脆弱性報告を受けたときの初動と社内連携フロー',
      'Defensive coding practices to reduce injection risks'
    ]
  },
  {
    category: 'cloud-ops',
    tags: ['cloud', 'クラウド', 'sre'],
    contents: [
      'SREの基本とサービスレベル目標の決め方',
      'Kubernetes rollout patterns with low risk migration',
      '障害対応で学びを残すためのポストモーテム設計',
      'Cloud cost controls for multi environment deployments',
      'オンコール運用を持続可能にするアラート設計',
      'Capacity planning approach for seasonal traffic spikes'
    ]
  },
  {
    category: 'mobile-dev',
    tags: ['mobile', 'モバイル', 'ios'],
    contents: [
      'モバイルアプリの起動速度改善と初期描画最適化',
      'Offline first sync design for field worker applications',
      'iOSとAndroidで共通化しやすい画面設計の実例',
      'Battery friendly networking for background sync tasks',
      'クラッシュ分析から改善施策を優先順位付けする',
      'Cross platform release testing with limited QA resources'
    ]
  },
  {
    category: 'product-management',
    tags: ['product', 'プロダクト', 'roadmap'],
    contents: [
      'プロダクトロードマップを価値ベースで整理する方法',
      'Discovery interview methods for ambiguous user needs',
      '実験設計で避けるべき計測バイアスと判断ミス',
      'How to align engineering and product on outcome goals',
      '要求定義の粒度を揃えて開発速度を落とさない工夫',
      'Roadmap communication patterns for executive stakeholders'
    ]
  },
  {
    category: 'fintech',
    tags: ['fintech', '金融', 'payments'],
    contents: [
      '決済機能の導入時に確認すべき運用と障害対応設計',
      'Fraud prevention signals for subscription payment systems',
      '台帳設計で整合性と監査性を両立させる実践例',
      'Regulatory checkpoints for launching fintech products',
      '与信スコアリングの前処理と特徴量設計の基本',
      'Chargeback handling workflow for international merchants'
    ]
  }
];

const evaluationJaMixedDocuments: EvaluationMixedDocument[] = jaMixedTopicTemplates.flatMap((topic, topicIndex) => (
  topic.contents.map((content, contentIndex) => ({
    id: `ja-eval-${String(topicIndex + 1).padStart(2, '0')}-${String(contentIndex + 1).padStart(2, '0')}`,
    content,
    category: topic.category,
    tags: topic.tags,
    languageScope: 'ja'
  }))
));

export default evaluationJaMixedDocuments;
