import { expect } from 'chai';
import ContentBasedRecommender from '../src/lib/ContentBasedRecommender.js';
import { Document } from '../src/types/index.js';

describe('BM25Recommender', () => {
  it('should train English documents with BM25 and rank related content first', async () => {
    const recommender = new ContentBasedRecommender({
      algorithm: 'bm25',
      language: 'en',
      minScore: 0,
    });

    const documents: Document[] = [
      {
        id: '1',
        title: 'Frontend component design patterns',
        content: 'javascript frontend component design patterns'
      },
      {
        id: '2',
        title: 'Component design tutorial',
        content: 'javascript frontend tutorial for component design'
      },
      {
        id: '3',
        title: 'Quantum physics',
        content: 'quantum physics particle experiment results'
      },
      {
        id: '4',
        title: 'Web component architecture',
        content: 'web component architecture with javascript frontend'
      },
    ];

    await recommender.train(documents);

    const similarDocuments = recommender.getSimilarDocuments('1');

    expect(similarDocuments).to.have.length.greaterThan(0);
    expect(similarDocuments[0].id).to.equal('2');
    expect(similarDocuments[0].score).to.be.a('number');
  });

  it('should index title content for BM25 when title is available', async () => {
    const recommender = new ContentBasedRecommender({
      algorithm: 'bm25',
      language: 'en',
      minScore: 0,
    });

    const documents: Document[] = [
      {
        id: '1',
        title: 'Frontend architecture patterns',
        content: 'delivery planning and team process notes'
      },
      {
        id: '2',
        title: 'Frontend architecture guide',
        content: 'roadmap sync and delivery checklist'
      },
      {
        id: '3',
        title: 'Database query tuning',
        content: 'index maintenance and vacuum strategy'
      },
    ];

    await recommender.train(documents);

    const similarDocuments = recommender.getSimilarDocuments('1');

    expect(similarDocuments).to.have.length.greaterThan(0);
    expect(similarDocuments[0].id).to.equal('2');
  });

  it('should respect maxSimilarDocuments with BM25', async () => {
    const recommender = new ContentBasedRecommender({
      algorithm: 'bm25',
      language: 'en',
      maxSimilarDocuments: 1,
      minScore: 0,
    });

    const documents: Document[] = [
      { id: '1', content: 'machine learning project planning and metrics' },
      { id: '2', content: 'machine learning evaluation metrics and baselines' },
      { id: '3', content: 'model deployment planning for machine learning teams' },
    ];

    await recommender.train(documents);

    expect(recommender.getSimilarDocuments('1')).to.have.length.at.most(1);
  });

  it('should train mixed Japanese and English documents with BM25', async () => {
    const recommender = new ContentBasedRecommender({
      algorithm: 'bm25',
      language: 'ja',
      minScore: 0,
    });

    const documents: Document[] = [
      { id: '1', content: '機械学習 machine learning の基礎を学ぶ' },
      { id: '2', content: 'machine learning project planning とモデル評価' },
      { id: '3', content: '旅行ガイドとホテル予約のコツ' },
    ];

    await recommender.train(documents);

    const similarDocuments = recommender.getSimilarDocuments('1');
    const similarIds = similarDocuments.map((document) => document.id);

    expect(similarIds).to.include('2');
  }).timeout(10000);

  it('should support bidirectional training with BM25', async () => {
    const recommender = new ContentBasedRecommender({
      algorithm: 'bm25',
      language: 'en',
      minScore: 0,
    });

    const documents: Document[] = [
      {
        id: 'post-1',
        title: 'Frontend design system',
        content: 'javascript frontend component design system'
      },
      {
        id: 'post-2',
        title: 'Database optimization',
        content: 'database indexing and query optimization guide'
      },
    ];
    const targetDocuments: Document[] = [
      { id: 'tag-frontend', content: 'frontend javascript component ui' },
      { id: 'tag-database', content: 'database query performance' },
    ];

    await recommender.trainBidirectional(documents, targetDocuments);

    const similarDocuments = recommender.getSimilarDocuments('post-1');
    expect(similarDocuments).to.have.length.greaterThan(0);
    expect(similarDocuments[0].id).to.equal('tag-frontend');
  });

  it('should preserve repeated Japanese tokens for BM25 scoring by default', async () => {
    const recommender = new ContentBasedRecommender({
      algorithm: 'bm25',
      language: 'ja',
      minScore: 0,
    });

    const documents: Document[] = [
      { id: '1', content: '猫 猫 猫 犬' },
      { id: '2', content: '猫 猫' },
      { id: '3', content: '猫' },
      { id: '4', content: '車' },
    ];

    await recommender.train(documents);

    const similarDocuments = recommender.getSimilarDocuments('1');

    expect(similarDocuments[0].id).to.equal('2');
    expect(similarDocuments[1].id).to.equal('3');
    expect(similarDocuments[0].score).to.be.greaterThan(similarDocuments[1].score);
  }).timeout(10000);
});
