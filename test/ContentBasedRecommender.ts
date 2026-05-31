import { expect } from 'chai';
import ContentBasedRecommender from '../src/lib/ContentBasedRecommender.js';
import { Document } from '../src/types/index.js';
import sampleDocuments from '../fixtures/sample-documents.js';
import sampleTargetDocuments from '../fixtures/sample-target-documents.js';
import sampleJapaneseDocuments from '../fixtures/sample-japanese-documents.js';

/**
 * ContentBasedRecommenderのテストスイート
 * オプション検証、文書検証、学習結果検証、エクスポート/インポート機能をテスト
 */

describe('ContentBasedRecommender', () => {
  describe('options validation', () => {
    it('should only accept maxVectorSize greater than 0', () => {
      expect(() => {
        const recommender = new ContentBasedRecommender({
          maxVectorSize: -1,
        });
        recommender.train(sampleDocuments);
      }).to.throw('The option maxVectorSize should be integer and greater than 0');
    });

    it('should only accept maxSimilarDocuments greater than 0', () => {
      expect(() => {
        const recommender = new ContentBasedRecommender({
          maxSimilarDocuments: -1,
        });
        recommender.train(sampleDocuments);
      }).to.throw('The option maxSimilarDocuments should be integer and greater than 0');
    });

    it('should only accept minScore between 0 and 1', () => {
      expect(() => {
        const recommender = new ContentBasedRecommender({
          minScore: -1,
        });
        recommender.train(sampleDocuments);
      }).to.throw('The option minScore should be a number between 0 and 1');

      expect(() => {
        const recommender = new ContentBasedRecommender({
          minScore: 2,
        });
        recommender.train(sampleDocuments);
      }).to.throw('The option minScore should be a number between 0 and 1');
    });

    it('should only accept algorithm as tfidf, lsa or bm25', () => {
      expect(() => {
        const recommender = new ContentBasedRecommender({
          algorithm: 'bm25',
        });
        recommender.train(sampleDocuments);
      }).to.not.throw();

      expect(() => {
        const recommender = new ContentBasedRecommender({
          algorithm: 'invalid' as any,
        });
        recommender.train(sampleDocuments);
      }).to.throw('The option algorithm should be either "tfidf", "lsa", "bm25" or "embedding"');
    });

    it('should only accept lsaDimensions greater than 0', () => {
      expect(() => {
        const recommender = new ContentBasedRecommender({
          lsaDimensions: 0,
        });
        recommender.train(sampleDocuments);
      }).to.throw('The option lsaDimensions should be integer and greater than 0');
    });
  });

  describe('documents validation', () => {
    const recommender = new ContentBasedRecommender();

    it('should only accept array of documents', async () => {
      try {
        await recommender.train({
          1000001: 'Hello World',
          1000002: 'I love programming!',
        } as any);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Documents should be an array of objects');
      }
    });

    it('should only accept array of documents, with fields id and content', async () => {
      try {
        await recommender.train([
          {
            name: '1000001',
            text: 'Hello World'
          },
          {
            name: '1000002',
            text: 'I love programming!'
          },
        ] as any);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Documents should be have fields id and content');
      }
    });
  });

  describe('training result validation', () => {
    it('should return list of similar documents in right order', async () => {
      const recommender = new ContentBasedRecommender();
      await recommender.train(sampleDocuments);

      const similarDocuments = recommender.getSimilarDocuments('1000002');

      const ids = similarDocuments.map(document => document.id);
      expect(ids).to.deep.equal(['1000004', '1000005', '1000009', '1000003', '1000006', '1000001']);
    });

    it('should to be able to control how many similar documents to obtain', async () => {
      const recommender = new ContentBasedRecommender();
      await recommender.train(sampleDocuments);

      let similarDocuments = recommender.getSimilarDocuments('1000002', 0, 2);
      let ids = similarDocuments.map(document => document.id);
      expect(ids).to.deep.equal(['1000004', '1000005']);

      similarDocuments = recommender.getSimilarDocuments('1000002', 2);
      ids = similarDocuments.map(document => document.id);
      expect(ids).to.deep.equal(['1000009', '1000003', '1000006', '1000001']);

      similarDocuments = recommender.getSimilarDocuments('1000002', 1, 3);
      ids = similarDocuments.map(document => document.id);
      expect(ids).to.deep.equal(['1000005', '1000009', '1000003']);
    });

    it('should to be able to control the minScore of similar documents', async () => {
      const recommender = new ContentBasedRecommender({ minScore: 0.4 });
      await recommender.train(sampleDocuments);

      sampleDocuments.forEach((document: Document) => {
        const similarDocuments = recommender.getSimilarDocuments(document.id);
        const scores = similarDocuments.map(similarDocument => similarDocument.score);
        scores.forEach((score: number) => {
          expect(score).to.be.at.least(0.4);
        });
      });
    });

    it('should to be able to control the maximum number of similar documents', async () => {
      const recommender = new ContentBasedRecommender({ maxSimilarDocuments: 3 });
      await recommender.train(sampleDocuments);

      sampleDocuments.forEach((document: Document) => {
        const similarDocuments = recommender.getSimilarDocuments(document.id);
        expect(similarDocuments).to.have.length.at.most(3);
      });
    });
  });

  describe('training multi collection result validation', () => {
    it('should return list of similar documents of the target collection in right order', async () => {
      const recommender = new ContentBasedRecommender();
      await recommender.trainBidirectional(sampleDocuments, sampleTargetDocuments);

      const similarDocuments = recommender.getSimilarDocuments('1000011');

      const ids = similarDocuments.map(document => document.id);
      expect(ids).to.deep.equal(['1000002', '1000004', '1000005', '1000009', '1000003', '1000006', '1000001']);
    });

    it('should to be able to control how many similar documents to obtain using multiple collections', async () => {
      const recommender = new ContentBasedRecommender();
      await recommender.trainBidirectional(sampleDocuments, sampleTargetDocuments);

      let similarDocuments = recommender.getSimilarDocuments('1000011', 0, 2);
      let ids = similarDocuments.map(document => document.id);
      expect(ids).to.deep.equal(['1000002', '1000004']);

      similarDocuments = recommender.getSimilarDocuments('1000011', 2);
      ids = similarDocuments.map(document => document.id);
      expect(ids).to.deep.equal(['1000005', '1000009', '1000003', '1000006', '1000001']);

      similarDocuments = recommender.getSimilarDocuments('1000011', 1, 3);
      ids = similarDocuments.map(document => document.id);
      expect(ids).to.deep.equal(['1000004', '1000005', '1000009']);
    });

    it('should to be able to control the minScore of similar documents', async () => {
      const recommender = new ContentBasedRecommender({ minScore: 0.4 });
      await recommender.train(sampleDocuments);

      sampleDocuments.forEach((document: Document) => {
        const similarDocuments = recommender.getSimilarDocuments(document.id);
        const scores = similarDocuments.map(similarDocument => similarDocument.score);
        scores.forEach((score: number) => {
          expect(score).to.be.at.least(0.4);
        });
      });
    });

    it('should to be able to control the maximum number of similar documents', async () => {
      const recommender = new ContentBasedRecommender({ maxSimilarDocuments: 3 });
      await recommender.train(sampleDocuments);

      sampleDocuments.forEach((document: Document) => {
        const similarDocuments = recommender.getSimilarDocuments(document.id);
        expect(similarDocuments).to.have.length.at.most(3);
      });
    });
  });

  describe('export and import', () => {
    it('should to be able to give the same results with recommender created by import method', async () => {
      const recommender = new ContentBasedRecommender({
        maxSimilarDocuments: 3,
        minScore: 0.4,
      });
      await recommender.train(sampleDocuments);

      const exportedData = recommender.export();

      // エクスポート結果に基づいて別の推薦システムを作成
      const recommender2 = new ContentBasedRecommender(exportedData.options);
      recommender2.import(exportedData);

      sampleDocuments.forEach((document: Document) => {
        const similarDocuments = recommender.getSimilarDocuments(document.id);
        const similarDocuments2 = recommender2.getSimilarDocuments(document.id);

        expect(similarDocuments).to.deep.equal(similarDocuments2);
      });
    });
  });

  describe('Japanese language support', () => {
    it('should accept language option "ja"', () => {
      expect(() => {
        new ContentBasedRecommender({
          language: 'ja',
        });
      }).to.not.throw();
    });

    it('should reject invalid language option', () => {
      expect(() => {
        new ContentBasedRecommender({
          language: 'fr' as any,
        });
      }).to.throw('The option language should be either "en" or "ja"');
    });

    it('should successfully train with Japanese documents', async () => {
      const recommender = new ContentBasedRecommender({
        language: 'ja',
        debug: false,
        minScore: 0.0,
      });

      // 日本語文書での学習をテスト
      await recommender.train(sampleJapaneseDocuments);

      // 類似文書を取得できることを確認
      const similarDocuments = recommender.getSimilarDocuments('jp1000001');
      expect(similarDocuments).to.be.an('array');
    }).timeout(10000); // タイムアウトを10秒に設定

    it('should find similarities between Japanese documents with common keywords', async () => {
      const recommender = new ContentBasedRecommender({
        language: 'ja',
        minScore: 0.1,
      });

      // より関連性の高い文書でテスト
      const documents = [
        {
          id: '1',
          content: 'JavaScriptプログラミングは楽しいです',
        },
        {
          id: '2',
          content: 'JavaScript開発の基礎知識を学びます',
        },
        {
          id: '3',
          content: 'プログラミング言語の比較検討',
        },
      ];

      await recommender.train(documents);

      // 「プログラミング」というキーワードを共有する文書間で類似度が検出されることを確認
      const similarToDoc1 = recommender.getSimilarDocuments('1');
      const similarToDoc3 = recommender.getSimilarDocuments('3');

      expect(similarToDoc1).to.be.an('array');
      expect(similarToDoc3).to.be.an('array');

      // 文書1と文書3が「プログラミング」で関連付けられることを確認
      const doc1SimilarIds = similarToDoc1.map(doc => doc.id);
      const doc3SimilarIds = similarToDoc3.map(doc => doc.id);

      expect(doc1SimilarIds).to.include('3');
      expect(doc3SimilarIds).to.include('1');

    }).timeout(10000);

    it('should process Japanese morphological analysis correctly', async () => {
      const recommender = new ContentBasedRecommender({
        language: 'ja',
      });

      // 機械学習に関連する文書を用意
      const mlDocuments = [
        {
          id: 'ml1',
          content: '機械学習の基礎概念について説明します',
        },
        {
          id: 'ml2',
          content: 'ディープラーニングは機械学習の一分野です',
        },
        {
          id: 'ml3',
          content: '自然言語処理における機械学習の応用',
        },
      ];

      await recommender.train(mlDocuments);

      // 「機械学習」というキーワードを含む文書間で類似度が計算されることを確認
      const similarToMl1 = recommender.getSimilarDocuments('ml1');
      expect(similarToMl1).to.be.an('array');

      // 機械学習関連の文書が類似文書として検出されることを期待
      const relatedIds = similarToMl1.map(doc => doc.id);
      expect(relatedIds).to.include.oneOf(['ml2', 'ml3']);

    }).timeout(10000);
  });
});
