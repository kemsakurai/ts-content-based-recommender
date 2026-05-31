TypeScript Content Based Recommender
=======

[![Node.js CI](https://github.com/kensakurai/ts-content-based-recommender/workflows/Node.js%20CI/badge.svg)](https://github.com/kensakurai/ts-content-based-recommender/actions?query=workflow%3A%22Node.js+CI%22)
[![NPM version](https://img.shields.io/npm/v/ts-content-based-recommender.svg)](https://www.npmjs.com/package/ts-content-based-recommender)

This is a TypeScript-based content-based recommender with enhanced multilingual support, forked from [stanleyfok/content-based-recommender](https://github.com/stanleyfok/content-based-recommender).

## Credits

This package is forked from [stanleyfok/content-based-recommender](https://github.com/stanleyfok/content-based-recommender) by Stanley Fok.

### Original Author
- **Stanley Fok** - Original implementation and concept

### Enhancements in this fork
- **Full TypeScript support** with comprehensive type definitions
- **Japanese language support** using kuromoji morphological analyzer
- **Enhanced multilingual text processing** capabilities
- **Improved testing coverage** with better error handling
- **Updated dependencies** and modern build system with ESLint v9
- **Performance optimizations** in similarity calculations
- **Modular architecture** with separated tokenizers and filters
- **Factory pattern implementation** for easy component creation

## What's New

#### Latest Version

* **Modular Architecture**: Separated tokenizers and filters into independent classes
* **Factory Pattern**: Introduced `ProcessingPipelineFactory` for easy component creation
* **Enhanced Testing**: Moved all tests to `test/` directory with improved coverage
* **Improved Japanese Support**: Advanced morphological analysis with part-of-speech filtering
* **BM25 Support**: Added MiniSearch-based BM25 ranking with English and Japanese preprocessing
* **Better TypeScript Support**: Comprehensive type definitions for all components

#### 1.5.0

* Added `trainBidirectional(collectionA, collectionB)` to allow recommendations between
two different datasets

#### 1.4.0

Upgrade dependencies to fix security alerts

#### 1.3.0

Introduce the use of unigram, bigrams and trigrams when constructing the word vector

#### 1.2.0

Simplify the implementation by not using sorted set data structure to store the similar documents data. Also support the maxSimilarDocuments and minScore options to save memory used by the recommender.

#### 1.1.0

Update to newer version of [vector-object](https://www.npmjs.com/package/vector-object)

## Installation

`npm install ts-content-based-recommender`

And then import the ContentBasedRecommender class
```js
const ContentBasedRecommender = require('ts-content-based-recommender')
```

For TypeScript projects:
```ts
import ContentBasedRecommender from 'ts-content-based-recommender'
// or import individual components
import {
  ProcessingPipelineFactory,
  EnglishTokenizer,
  JapaneseTokenizer,
  EnglishTokenFilter,
  JapaneseTokenFilter
} from 'ts-content-based-recommender'
```

## Overview

This is a content-based recommender implemented in TypeScript to illustrate the concept of content-based recommendation. Content-based recommender is a popular recommendation technique to show similar items to users, especially useful to websites for e-commerce, news content, etc.

After the recommender is trained by an array of documents, it can tell the list of documents which are more similar to the input document.

The training process involves 3 main steps:
* content pre-processing, such as html tag stripping, [stopwords](http://xpo6.com/list-of-english-stop-words/) removal and [stemming](http://9ol.es/porter_js_demo.html)
* ranking document features using [tf-idf](https://lizrush.gitbooks.io/algorithms-for-webdevs-ebook/content/chapters/tf-idf.html), LSA, or BM25
* calculate related document scores from vectors or BM25 search results depending on the selected algorithm

Special thanks to the library [natural](https://www.npmjs.com/package/natural) helps a lot by providing a lot of NLP functionalities, such as tf-idf and word stemming.

**⚠️ Note:**

I haven't tested how this recommender is performing with a large dataset. I will share more results after some more testing.

## Language Support

### English
- Tokenization using natural.WordTokenizer
- Porter Stemmer for word stemming
- Stopword removal
- N-gram support (unigram, bigram, trigram)

### Japanese
- Morphological analysis using kuromoji
- Part-of-speech filtering (nouns, verbs, adjectives)
- Japanese-specific text processing

## Usage

### Single collection

```ts
import ContentBasedRecommender from 'ts-content-based-recommender'

const recommender = new ContentBasedRecommender({
  minScore: 0.1,
  maxSimilarDocuments: 100
});

// prepare documents data
const documents = [
  { id: '1000001', content: 'Why studying javascript is fun?' },
  { id: '1000002', content: 'The trend for javascript in machine learning' },
  { id: '1000003', content: 'The most insightful stories about JavaScript' },
  { id: '1000004', content: 'Introduction to Machine Learning' },
  { id: '1000005', content: 'Machine learning and its application' },
  { id: '1000006', content: 'Python vs Javascript, which is better?' },
  { id: '1000007', content: 'How Python saved my life?' },
  { id: '1000008', content: 'The future of Bitcoin technology' },
  { id: '1000009', content: 'Is it possible to use javascript for machine learning?' }
];

// start training (now async)
await recommender.train(documents);

//get top 10 similar items to document 1000002
const similarDocuments = recommender.getSimilarDocuments('1000002', 0, 10);

console.log(similarDocuments);
/*
  the higher the score, the more similar the item is
  documents with score < 0.1 are filtered because options minScore is set to 0.1
  [
    { id: '1000004', score: 0.5114304586412038 },
    { id: '1000009', score: 0.45056313558918837 },
    { id: '1000005', score: 0.37039308109283564 },
    { id: '1000003', score: 0.10896767690747626 }
  ]
*/
```

### BM25 ranking

Use `algorithm: 'bm25'` when you want keyword-heavy ranking with MiniSearch.
If a document includes `title`, BM25 indexes both `title` and `content`.
Japanese documents are tokenized with the existing kuromoji pipeline before indexing.

```ts
import ContentBasedRecommender from 'ts-content-based-recommender'

const recommender = new ContentBasedRecommender({
  algorithm: 'bm25',
  language: 'ja',
  maxSimilarDocuments: 5,
  minScore: 0,
});

const documents = [
  {
    id: 'post-1',
    title: '日本語検索設計',
    content: 'MiniSearch で日本語 BM25 検索を扱うときの設計ポイント',
  },
  {
    id: 'post-2',
    title: '検索インデックス最適化',
    content: 'BM25 スコアと日本語トークン化の基礎を整理する',
  },
  {
    id: 'post-3',
    title: '決済基盤運用',
    content: '障害対応フローと監視設計のまとめ',
  },
];

await recommender.train(documents);

console.log(recommender.getSimilarDocuments('post-1'));
```

BM25 scores are raw ranking scores and are not normalized to the 0-1 range.

### Multi collection

This example shows how to automatically match posts with related tags

```ts
import ContentBasedRecommender from 'ts-content-based-recommender'

const posts = [
  {
    id: '1000001',
    content: 'Why studying javascript is fun?',
  },
  {
    id: '1000002',
    content: 'The trend for javascript in machine learning',
  },
  {
    id: '1000003',
    content: 'The most insightful stories about JavaScript',
  },
  {
    id: '1000004',
    content: 'Introduction to Machine Learning',
  },
  {
    id: '1000005',
    content: 'Machine learning and its application',
  },
  {
    id: '1000006',
    content: 'Python vs Javascript, which is better?',
  },
  {
    id: '1000007',
    content: 'How Python saved my life?',
  },
  {
    id: '1000008',
    content: 'The future of Bitcoin technology',
  },
  {
    id: '1000009',
    content: 'Is it possible to use javascript for machine learning?',
  },
];

const tags = [
               {
                 id: '1',
                 content: 'Javascript',
               },
               {
                 id: '2',
                 content: 'machine learning',
               },
               {
                 id: '3',
                 content: 'application',
               },
               {
                 id: '4',
                 content: 'introduction',
               },
               {
                 id: '5',
                 content: 'future',
               },
               {
                 id: '6',
                 content: 'Python',
               },
               {
                 id: '7',
                 content: 'Bitcoin',
               },
             ];

const tagMap = tags.reduce((acc, tag) => {
  acc[tag.id] = tag;
  return acc;
}, {});

const recommender = new ContentBasedRecommender();

// Training is now async
await recommender.trainBidirectional(posts, tags);

for (const post of posts) {
  const relatedTags = recommender.getSimilarDocuments(post.id);
  const tagNames = relatedTags.map(t => tagMap[t.id].content);
  console.log(post.content, 'related tags:', tagNames);
}


/*
Why studying javascript is fun? related tags: [ 'Javascript' ]
The trend for javascript in machine learning related tags: [ 'machine learning', 'Javascript' ]
The most insightful stories about JavaScript related tags: [ 'Javascript' ]
Introduction to Machine Learning related tags: [ 'machine learning', 'introduction' ]
Machine learning and its application related tags: [ 'machine learning', 'application' ]
Python vs Javascript, which is better? related tags: [ 'Python', 'Javascript' ]
How Python saved my life? related tags: [ 'Python' ]
The future of Bitcoin technology related tags: [ 'future', 'Bitcoin' ]
Is it possible to use javascript for machine learning? related tags: [ 'machine learning', 'Javascript' ]
*/

```

## Benchmark

Run all benchmark scenarios:

```bash
npm run benchmark
```

Run BM25 only for the mixed Japanese dataset:

```bash
npm run benchmark -- --dataset evaluation-ja-mixed --algorithm bm25
```

### Latest Benchmark Snapshot

The following results were measured locally on 2026-05-31 after reducing Japanese preprocessing memory usage by removing duplicate morphological analysis and keeping the memory-efficient local preprocessing path. Values depend on machine, Node.js runtime, and current dependency versions.

| Dataset | Algorithm | Train ms | Warm avg ms | Warm p95 ms | RSS delta MB | Precision@5 | Recall@5 | Avg tag overlap@5 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| evaluation-en | tfidf | 25.691 | 0.000035 | 0.000051 | 16.703 | 0.123 | 0.123 | 0.151 |
| evaluation-en | lsa | 86.285 | 0.000020 | 0.000044 | 40.125 | 0.120 | 0.120 | 0.120 |
| evaluation-en | bm25 | 23.851 | 0.000016 | 0.000034 | 15.547 | 0.127 | 0.127 | 0.154 |
| evaluation-ja-mixed | tfidf | 170.781 | 0.000019 | 0.000032 | 356.578 | 0.050 | 0.050 | 0.050 |
| evaluation-ja-mixed | lsa | 209.024 | 0.000035 | 0.000052 | 396.422 | 0.070 | 0.070 | 0.070 |
| evaluation-ja-mixed | bm25 | 182.513 | 0.000015 | 0.000034 | 353.156 | 0.060 | 0.060 | 0.061 |

For this snapshot, BM25 is the strongest option on the English dataset, while LSA has the best accuracy on the mixed Japanese dataset. BM25 remains the fastest inference path across both datasets.

### Japanese Language Example

```ts
import ContentBasedRecommender from 'ts-content-based-recommender'

const recommender = new ContentBasedRecommender({
  language: 'ja', // 日本語サポートを有効化
  minScore: 0.1,
  maxSimilarDocuments: 100
});

// 日本語文書データの準備
const japaneseDocuments = [
  { id: '1', content: 'JavaScriptプログラミングは楽しいです。フロントエンドの開発に最適です。' },
  { id: '2', content: 'プログラミング言語の比較検討。PythonとJavaScriptの違いについて。' },
  { id: '3', content: '機械学習の基礎知識。データサイエンスへの応用。' },
  { id: '4', content: 'ウェブ開発のベストプラクティス。モダンなJavaScript技術。' },
  { id: '5', content: 'データ分析とビジュアライゼーション。統計学の活用。' }
];

// 学習開始（非同期処理）
await recommender.train(japaneseDocuments);

// 文書IDが'1'に類似した上位5件を取得
const similarDocuments = recommender.getSimilarDocuments('1', 0, 5);

console.log(similarDocuments);
/*
  日本語の形態素解析により、より精密な類似度計算が可能
  [
    { id: '4', score: 0.45123456789 },
    { id: '2', score: 0.32456789012 }
  ]
*/

```

### Using Individual Components

The library now provides modular components that can be used independently:

```ts
import {
  ProcessingPipelineFactory,
  EnglishTokenizer,
  JapaneseTokenizer,
  EnglishTokenFilter,
  JapaneseTokenFilter
} from 'ts-content-based-recommender'

// Using factory pattern to create processing pipelines
const englishPipeline = ProcessingPipelineFactory.createPipeline('en', {
  minTokenLength: 2,
  removeStopwords: true,
  customStopWords: ['custom', 'words']
});

const japanesePipeline = ProcessingPipelineFactory.createPipeline('ja', {
  allowedPos: ['名詞', '動詞', '形容詞'],  // part-of-speech filtering
  minTokenLength: 1
});

// Using tokenizers directly
const englishTokenizer = ProcessingPipelineFactory.createTokenizer('en');
const japaneseTokenizer = ProcessingPipelineFactory.createTokenizer('ja');

const englishTokens = await englishTokenizer.tokenize('machine learning algorithm');
const japaneseTokens = await japaneseTokenizer.tokenize('機械学習アルゴリズム');

// Using filters directly
const englishFilter = new EnglishTokenFilter({
  removeDuplicates: true,
  removeStopwords: true,
  minTokenLength: 2
});

const japaneseFilter = new JapaneseTokenFilter({
  allowedPos: ['名詞', '動詞'],
  removeDuplicates: false
});

const filteredEnglishTokens = englishFilter.filter(englishTokens);
const filteredJapaneseTokens = japaneseFilter.filter(japaneseTokens);
```

### Advanced Configuration Example

```ts
import ContentBasedRecommender from 'ts-content-based-recommender'

// Example with advanced token filtering options
const recommender = new ContentBasedRecommender({
  language: 'ja',
  minScore: 0.1,
  maxSimilarDocuments: 50,
  tokenFilterOptions: {
    removeDuplicates: false,           // Keep duplicate tokens for frequency analysis
    removeStopwords: true,             // Remove Japanese stopwords
    minTokenLength: 2,                 // Exclude tokens shorter than 2 characters
    allowedPos: ['名詞', '動詞'],       // Only extract nouns and verbs
    customStopWords: ['です', 'ます']   // Additional custom stopwords
  }
});

const documents = [
  { id: '1', content: 'JavaScriptプログラミングはとても楽しいです' },
  { id: '2', content: 'Pythonによる機械学習の勉強をします' },
  { id: '3', content: 'ウェブ開発の最新技術トレンド' }
];

await recommender.train(documents);
const similar = recommender.getSimilarDocuments('1');
```

## API Reference

### ContentBasedRecommender

The main class for content-based recommendations.

### constructor([options])

To create the recommender instance

* options (optional): an object to configure the recommender

Supported options:

* **language** - the language to use for text processing. Supported values: 'en'（English）, 'ja'（Japanese）. Default is 'en'.
* **maxVectorSize** - to control the max size of word vector after tf-idf processing. A smaller vector size will help training performance while not affecting recommendation quality. Defaults to be 100.
* **minScore** - the minimum score required to meet to consider it is a similar document. It will save more memory by filtering out documents having low scores. Allowed values range from 0 to 1. Default is 0.
* **maxSimilarDocuments** - the maximum number of similar documents to keep for each document. Default is the max safe integer in javascript.
* **debug** - show progress messages so can monitor the training progress
* **tokenFilterOptions** - advanced filtering options for token processing:
  * **removeDuplicates** - remove duplicate tokens（default: true）
  * **removeStopwords** - remove stopwords（default: true）
  * **customStopWords** - additional custom stopwords（default: empty array）
  * **minTokenLength** - minimum token length（default: 1）
  * **allowedPos** - for Japanese: allowed part-of-speech tags（default: 名詞、動詞、形容詞）

### train(documents)

To tell the recommender about your documents and then it will start training itself.

* documents - an array of object, with fields **id** and **content**

**Note**: This method is now asynchronous and returns a Promise. Use `await` or `.then()` to handle the async operation.

### trainBidirectional(collectionA, collectionB)

Works like the normal train function, but it creates recommendations
between two different collections instead of within one collection.

**Note**: This method is now asynchronous and returns a Promise. Use `await` or `.then()` to handle the async operation.

### getSimilarDocuments(id, [start], [size])

To get an array of similar items with document id

* id - the id of the document
* start - the start index, inclusive. Default to be 0
* size - the max number of similar documents to obtain. If it is omitted, the whole list after start index will be returned

It returns an array of objects, with fields **id** and **score** (ranging from 0 to 1)

### export()

To export the recommender as json object.
```js
const recommender = new ContentBasedRecommender();
await recommender.train(documents);

const object = recommender.export();
//can save the object to disk, database or otherwise
```

### import(object)

To update the recommender by importing from a json object, exported by the export() method
```js
const recommender = new ContentBasedRecommender();
recommender.import(object); // object can be loaded from disk, database or otherwise
```

### ProcessingPipelineFactory

Factory class for creating processing pipelines and individual components.

#### ProcessingPipelineFactory.createPipeline(language, options)

Creates a complete processing pipeline with tokenizer and filter.

* **language** - 'en' for English or 'ja' for Japanese
* **options** - filter options (optional)

#### ProcessingPipelineFactory.createTokenizer(language)

Creates a tokenizer for the specified language.

* **language** - 'en' for English or 'ja' for Japanese

#### ProcessingPipelineFactory.createEnglishPipeline(options)

Creates an English-specific processing pipeline.

* **options** - filter options (optional)

#### ProcessingPipelineFactory.createJapanesePipeline(options)

Creates a Japanese-specific processing pipeline.

* **options** - filter options (optional)

### Tokenizers

#### EnglishTokenizer

Tokenizes English text with stemming and N-gram support.

```ts
const tokenizer = new EnglishTokenizer();
const tokens = await tokenizer.tokenize('machine learning algorithm');
```

#### JapaneseTokenizer

Tokenizes Japanese text using kuromoji morphological analyzer.

```ts
const tokenizer = new JapaneseTokenizer();
const tokens = await tokenizer.tokenize('機械学習アルゴリズム');
const detailedTokens = await tokenizer.getDetailedTokens('機械学習アルゴリズム');
```

### Filters

#### EnglishTokenFilter

Filters English tokens with stopword removal, N-gram support, and more.

```ts
const filter = new EnglishTokenFilter({
  removeDuplicates: true,
  removeStopwords: true,
  minTokenLength: 2,
  customStopWords: ['custom', 'words']
});
const filtered = filter.filter(tokens);
const ngramFiltered = filter.filterWithNgrams(tokens);
```

#### JapaneseTokenFilter

Filters Japanese tokens with part-of-speech filtering and Japanese-specific processing.

```ts
const filter = new JapaneseTokenFilter({
  allowedPos: ['名詞', '動詞', '形容詞'],
  removeDuplicates: true,
  removeStopwords: true,
  minTokenLength: 1
});
const filtered = filter.filter(tokens);
const posFiltered = filter.filterWithPos(detailedTokens);
```

### Filter Options

Common filter options for both English and Japanese:

* **removeDuplicates** - remove duplicate tokens（default: true）
* **removeStopwords** - remove stopwords（default: true）
* **customStopWords** - additional custom stopwords（default: empty array）
* **minTokenLength** - minimum token length（default: 1）

Japanese-specific options:

* **allowedPos** - allowed part-of-speech tags（default: 名詞、動詞、形容詞）

## Development

### Project Structure

```
├── src/                    # Source code
│   ├── lib/               # Main library code
│   │   ├── tokenizers/    # Tokenizer implementations
│   │   │   ├── EnglishTokenizer.ts
│   │   │   └── JapaneseTokenizer.ts
│   │   ├── filters/       # Token filter implementations
│   │   │   ├── EnglishTokenFilter.ts
│   │   │   └── JapaneseTokenFilter.ts
│   │   ├── factories/     # Factory classes
│   │   │   └── ProcessingPipelineFactory.ts
│   │   ├── ContentBasedRecommender.ts  # Main recommender class
│   │   └── index.ts       # Library exports
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   └── index.ts           # Main export file
├── test/                  # Test files
│   ├── tokenizers/        # Tokenizer tests
│   ├── filters/           # Filter tests
│   ├── factories/         # Factory tests
│   └── *.ts              # Integration and main tests
├── fixtures/              # Test data
│   ├── sample-documents.ts
│   ├── sample-document-tags.ts
│   ├── sample-target-documents.ts
│   └── sample-japanese-documents.ts
├── example/               # Usage examples
│   └── example.ts
├── index.ts               # Package entry point
├── tsconfig.json          # TypeScript configuration
└── eslint.config.js       # ESLint configuration
```

### Running Tests

The test suite includes comprehensive unit tests and integration tests for all components:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test categories
npm test -- --grep "EnglishTokenizer"
npm test -- --grep "JapaneseTokenizer"
npm test -- --grep "EnglishTokenFilter"
npm test -- --grep "JapaneseTokenFilter"
npm test -- --grep "ProcessingPipelineFactory"
npm test -- --grep "ContentBasedRecommender"

# Run example
npm run example

# Run development mode with ts-node
npm run dev
```

### Building

```bash
# Build TypeScript
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Authors

### Current Maintainer
  - [Ken Sakurai](https://github.com/kensakurai) - TypeScript migration and Japanese language support

### Original Author
  - [Stanley Fok](https://github.com/stanleyfok) - Original implementation

### Contributors
  - [Marian Klühspies](https://github.com/mklueh)

## License

  [MIT](./LICENSE)

## Historical Changes (from upstream)

This package is based on the original work by Stanley Fok.
For historical changes before the fork, see: https://github.com/stanleyfok/content-based-recommender
