import { Document } from '../src/types/index.js';

/**
 * 評価用の英語文書データ
 * - language: 'en' での評価を想定（英語のみ）
 * - 代理ラベルとして category/tags を持つ
 */
export interface EvaluationDocument extends Document {
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

const enTopicTemplates: TopicTemplate[] = [
  {
    category: 'ai-fundamentals',
    tags: ['ai', 'machine-learning', 'basics'],
    contents: [
      'AI fundamentals for product teams and practical planning',
      'Understanding supervised learning with simple project examples',
      'How to explain machine learning ideas to non technical stakeholders',
      'A beginner guide to model evaluation and data split strategy',
      'When to choose classification versus regression in real projects',
      'Common pitfalls when starting an AI initiative in a startup'
    ]
  },
  {
    category: 'nlp',
    tags: ['nlp', 'language-model', 'text-mining'],
    contents: [
      'Natural language processing basics for modern web services',
      'Tokenization choices that improve text similarity quality',
      'Named entity extraction for customer support automation',
      'Practical sentiment analysis with lightweight model pipelines',
      'How stemming and lemmatization affect retrieval relevance',
      'Building a text normalization layer for noisy user input'
    ]
  },
  {
    category: 'web-frontend',
    tags: ['frontend', 'react', 'performance'],
    contents: [
      'Frontend performance tuning with code splitting and lazy loading',
      'State management patterns for large React applications',
      'Accessibility checklist for production web interfaces',
      'How to design reusable UI components with clear contracts',
      'Monitoring user experience metrics in single page apps',
      'Improving bundle size without sacrificing developer experience'
    ]
  },
  {
    category: 'web-backend',
    tags: ['backend', 'nodejs', 'api'],
    contents: [
      'Node.js API design patterns for maintainable services',
      'Structured error handling strategy for backend applications',
      'Caching approaches for high traffic REST endpoints',
      'Database transaction basics for consistent backend logic',
      'Observability setup with logs metrics and distributed traces',
      'Rate limiting and security controls for public APIs'
    ]
  },
  {
    category: 'data-engineering',
    tags: ['data-pipeline', 'etl', 'analytics'],
    contents: [
      'Designing reliable ETL workflows for daily business reports',
      'Schema evolution strategies in data warehouse projects',
      'Data quality checks that prevent silent pipeline failures',
      'Incremental processing patterns for large event streams',
      'Partitioning techniques for faster analytical queries',
      'How to document data contracts between producer and consumer teams'
    ]
  },
  {
    category: 'mobile-dev',
    tags: ['mobile', 'ios', 'android'],
    contents: [
      'Mobile app architecture principles for long term maintainability',
      'Battery and network optimization tips for mobile engineers',
      'Offline first design patterns for travel and field apps',
      'Push notification strategy that balances value and noise',
      'Cross platform testing workflow for release confidence',
      'App startup performance tuning on constrained devices'
    ]
  },
  {
    category: 'security',
    tags: ['security', 'authentication', 'threat-modeling'],
    contents: [
      'Threat modeling workshop template for product engineering teams',
      'Authentication and session management best practices',
      'Secrets management patterns for cloud native applications',
      'Security review checklist for third party integrations',
      'How to handle vulnerability reports and coordinated disclosure',
      'Defensive coding habits that reduce common attack surfaces'
    ]
  },
  {
    category: 'cloud-ops',
    tags: ['cloud', 'kubernetes', 'sre'],
    contents: [
      'Service reliability engineering basics for small teams',
      'Kubernetes deployment strategies with safe rollback plans',
      'Capacity planning with realistic growth assumptions',
      'Incident response process that improves learning after outages',
      'Cost optimization tactics for multi environment cloud setups',
      'SLO definition and alerting policy for customer facing services'
    ]
  },
  {
    category: 'product-management',
    tags: ['product', 'roadmap', 'experimentation'],
    contents: [
      'How to prioritize roadmap items with clear value signals',
      'Running product discovery interviews with actionable outcomes',
      'Experiment design for measuring feature impact reliably',
      'Balancing short term delivery and long term platform health',
      'Writing product requirement documents that engineers can trust',
      'Communication patterns between product design and engineering'
    ]
  },
  {
    category: 'fintech',
    tags: ['fintech', 'payments', 'risk'],
    contents: [
      'Payments integration checklist for subscription products',
      'Fraud detection signals for card not present transactions',
      'Designing ledger systems with auditability and accuracy',
      'Regulatory concerns in fintech product expansion',
      'Risk scoring basics for digital lending services',
      'Operational controls for handling chargeback disputes'
    ]
  }
];

const evaluationEnDocuments: EvaluationDocument[] = enTopicTemplates.flatMap((topic, topicIndex) => (
  topic.contents.map((content, contentIndex) => ({
    id: `en-eval-${String(topicIndex + 1).padStart(2, '0')}-${String(contentIndex + 1).padStart(2, '0')}`,
    content,
    category: topic.category,
    tags: topic.tags,
    languageScope: 'en'
  }))
));

export default evaluationEnDocuments;
