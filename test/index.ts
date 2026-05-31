// テストファイルのインデックス
// Mochaが自動的に実行するためのエントリポイント

// 個別コンポーネントのテスト
import './tokenizers/EnglishTokenizer.js';
import './tokenizers/JapaneseTokenizer.js';
import './filters/EnglishTokenFilter.js';
import './filters/JapaneseTokenFilter.js';
import './factories/ProcessingPipelineFactory.js';

// 統合テスト
import './ContentBasedRecommenderImproved.js';
import './BM25Recommender.js';
import './pipeline-integration-test.js';

// 既存のテスト（後方互換性）
import './ContentBasedRecommender.js';
