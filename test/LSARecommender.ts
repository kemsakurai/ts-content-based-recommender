import { expect } from 'chai';
import ContentBasedRecommender from '../src/lib/ContentBasedRecommender.js';
import { Document } from '../src/types/index.js';

describe('LSARecommender', () => {
  it('should train English documents with LSA and rank related content first', async () => {
    const recommender = new ContentBasedRecommender({
      algorithm: 'lsa',
      language: 'en',
      lsaDimensions: 2,
      minScore: 0.01,
    });

    const documents: Document[] = [
      { id: '1', content: 'javascript frontend component design patterns' },
      { id: '2', content: 'javascript frontend tutorial for component design' },
      { id: '3', content: 'quantum physics particle experiment results' },
      { id: '4', content: 'web component architecture with javascript frontend' },
    ];

    await recommender.train(documents);

    const similarDocuments = recommender.getSimilarDocuments('1');

    expect(similarDocuments).to.have.length.greaterThan(0);
    expect(similarDocuments[0].id).to.be.oneOf(['2', '4']);
    expect(similarDocuments[0].score).to.be.a('number');
  });

  it('should respect maxSimilarDocuments with LSA', async () => {
    const recommender = new ContentBasedRecommender({
      algorithm: 'lsa',
      language: 'en',
      lsaDimensions: 2,
      maxSimilarDocuments: 1,
      minScore: 0.01,
    });

    const documents: Document[] = [
      { id: '1', content: 'machine learning project planning and metrics' },
      { id: '2', content: 'machine learning evaluation metrics and baselines' },
      { id: '3', content: 'model deployment planning for machine learning teams' },
    ];

    await recommender.train(documents);

    expect(recommender.getSimilarDocuments('1')).to.have.length.at.most(1);
  });

  it('should train mixed Japanese and English documents with LSA', async () => {
    const recommender = new ContentBasedRecommender({
      algorithm: 'lsa',
      language: 'ja',
      lsaDimensions: 2,
      minScore: 0.01,
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

  it('should support bidirectional training with LSA', async () => {
    const recommender = new ContentBasedRecommender({
      algorithm: 'lsa',
      language: 'en',
      lsaDimensions: 2,
      minScore: 0.01,
    });

    const documents: Document[] = [
      { id: 'post-1', content: 'javascript frontend component design system' },
      { id: 'post-2', content: 'database indexing and query optimization guide' },
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
});
