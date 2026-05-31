import { RecommenderOptions } from '../../types/index.js';
import { Bm25SimilarityService } from '../services/Bm25SimilarityService.js';
import { DocumentPreprocessor } from '../services/DocumentPreprocessor.js';
import { SimilarityResultBuilder } from '../services/SimilarityResultBuilder.js';
import { DocumentVectorFactory } from './DocumentVectorFactory.js';
import { SimilarityCalculator } from '../services/SimilarityCalculator.js';
import {
  Bm25TrainingStrategy,
  bm25TrainingStrategyMetadata,
} from '../strategies/Bm25TrainingStrategy.js';
import {
  EmbeddingTrainingStrategy,
  embeddingTrainingStrategyMetadata,
} from '../strategies/EmbeddingTrainingStrategy.js';
import {
  LsaTrainingStrategy,
  lsaTrainingStrategyMetadata,
} from '../strategies/LsaTrainingStrategy.js';
import {
  RecommenderTrainingStrategy,
  RecommenderTrainingStrategyMetadata,
} from '../strategies/RecommenderTrainingStrategy.js';
import {
  TfidfTrainingStrategy,
  tfidfTrainingStrategyMetadata,
} from '../strategies/TfidfTrainingStrategy.js';

type SupportedAlgorithm = 'tfidf' | 'lsa' | 'bm25' | 'embedding';

/**
 * ベクトル系 strategy の依存セット
 */
interface VectorTrainingDependencies {
  /** 文書前処理サービス */
  documentPreprocessor: DocumentPreprocessor;
  /** 文書ベクトル生成サービス */
  documentVectorFactory: DocumentVectorFactory;
  /** 類似度計算サービス */
  similarityCalculator: SimilarityCalculator;
}

/**
 * BM25 strategy の依存セット
 */
interface Bm25TrainingDependencies {
  /** 文書前処理サービス */
  documentPreprocessor: DocumentPreprocessor;
  /** BM25 類似度計算サービス */
  bm25SimilarityService: Bm25SimilarityService;
}

/**
 * 埋め込み strategy の依存セット
 */
interface EmbeddingTrainingDependencies {
  /** 文書前処理サービス */
  documentPreprocessor: DocumentPreprocessor;
  /** 類似度結果構築サービス */
  similarityResultBuilder: SimilarityResultBuilder;
}

/**
 * 学習戦略メタデータマップ
 */
const strategyMetadataMap: Record<SupportedAlgorithm, RecommenderTrainingStrategyMetadata> = {
  tfidf: tfidfTrainingStrategyMetadata,
  lsa: lsaTrainingStrategyMetadata,
  bm25: bm25TrainingStrategyMetadata,
  embedding: embeddingTrainingStrategyMetadata,
};

/**
 * 学習戦略ファクトリー
 */
export class TrainingStrategyFactory {
  /**
   * アルゴリズムに対応する学習戦略を取得する
   * @param algorithm 推薦アルゴリズム
   * @returns 学習戦略
   */
  public static create(algorithm: RecommenderOptions['algorithm'] = 'tfidf'): RecommenderTrainingStrategy {
    const resolvedAlgorithm = (algorithm ?? 'tfidf') as SupportedAlgorithm;

    switch (resolvedAlgorithm) {
      case 'lsa':
        return this.createLsaStrategy();
      case 'bm25':
        return this.createBm25Strategy();
      case 'embedding':
        return this.createEmbeddingStrategy();
      case 'tfidf':
      default:
        return this.createTfidfStrategy();
    }
  }

  /**
   * アルゴリズムに対応する学習戦略メタデータを取得する
   * @param algorithm 推薦アルゴリズム
   * @returns 学習戦略メタデータ
   */
  public static getMetadata(
    algorithm: RecommenderOptions['algorithm'] = 'tfidf'
  ): RecommenderTrainingStrategyMetadata {
    const resolvedAlgorithm = (algorithm ?? 'tfidf') as SupportedAlgorithm;
    return strategyMetadataMap[resolvedAlgorithm];
  }

  /**
   * TF-IDF 学習戦略を生成する
   * @returns TF-IDF 学習戦略
   */
  private static createTfidfStrategy(): RecommenderTrainingStrategy {
    const dependencies = this.createVectorTrainingDependencies();

    return new TfidfTrainingStrategy(
      dependencies.documentPreprocessor,
      dependencies.documentVectorFactory,
      dependencies.similarityCalculator
    );
  }

  /**
   * LSA 学習戦略を生成する
   * @returns LSA 学習戦略
   */
  private static createLsaStrategy(): RecommenderTrainingStrategy {
    const dependencies = this.createVectorTrainingDependencies();

    return new LsaTrainingStrategy(
      dependencies.documentPreprocessor,
      dependencies.documentVectorFactory,
      dependencies.similarityCalculator
    );
  }

  /**
   * BM25 学習戦略を生成する
   * @returns BM25 学習戦略
   */
  private static createBm25Strategy(): RecommenderTrainingStrategy {
    const dependencies = this.createBm25TrainingDependencies();

    return new Bm25TrainingStrategy(
      dependencies.documentPreprocessor,
      dependencies.bm25SimilarityService
    );
  }

  /**
   * 埋め込み学習戦略を生成する
   * @returns 埋め込み学習戦略
   */
  private static createEmbeddingStrategy(): RecommenderTrainingStrategy {
    const dependencies = this.createEmbeddingTrainingDependencies();

    return new EmbeddingTrainingStrategy(
      dependencies.documentPreprocessor,
      dependencies.similarityResultBuilder
    );
  }

  /**
   * ベクトル系 strategy 用の依存を生成する
   * @returns ベクトル系依存セット
   */
  private static createVectorTrainingDependencies(): VectorTrainingDependencies {
    const similarityResultBuilder = new SimilarityResultBuilder();

    return {
      documentPreprocessor: new DocumentPreprocessor(),
      documentVectorFactory: new DocumentVectorFactory(),
      similarityCalculator: new SimilarityCalculator(similarityResultBuilder),
    };
  }

  /**
   * BM25 strategy 用の依存を生成する
   * @returns BM25 依存セット
   */
  private static createBm25TrainingDependencies(): Bm25TrainingDependencies {
    const similarityResultBuilder = new SimilarityResultBuilder();

    return {
      documentPreprocessor: new DocumentPreprocessor(),
      bm25SimilarityService: new Bm25SimilarityService(similarityResultBuilder),
    };
  }

  /**
   * 埋め込み strategy 用の依存を生成する
   * @returns 埋め込み依存セット
   */
  private static createEmbeddingTrainingDependencies(): EmbeddingTrainingDependencies {
    return {
      documentPreprocessor: new DocumentPreprocessor(),
      similarityResultBuilder: new SimilarityResultBuilder(),
    };
  }
}
