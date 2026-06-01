# Changelog

## [1.6.3] - 2026-06-01

### Added
- **Embedding-based recommender** using `@xenova/transformers` (Wasm) for semantic similarity (#17)
- **LSA (Latent Semantic Analysis) recommender** for topic-based similarity (#20)
- **BM25 recommender** as an alternative to TF-IDF for improved relevance scoring

### Changed
- **Refactored ContentBasedRecommender** into service/strategy/factory architecture (#21)
- **Improved code organization** with dedicated factories, filters, services, strategies, and tokenizers

## [1.6.0] - 2025-06-30

### Added
- **Full TypeScript support** with comprehensive type definitions
- **Japanese language support** using kuromoji morphological analyzer
- **Enhanced multilingual text processing** capabilities
- **Comprehensive unit tests** with better error handling
- **Modern build system** with ESLint v9
- **Package name change** to `ts-content-based-recommender` to avoid conflicts

### Changed
- **Updated all dependencies** to latest versions
- **Improved code organization** and documentation
- **Enhanced error handling** and validation
- **Repository URLs** updated to fork location

### Fixed
- **Performance improvements** in similarity calculations
- **Memory usage optimization** with better resource management
- **Build system** improvements for better development experience

### Migration from upstream
- This package is forked from [stanleyfok/content-based-recommender](https://github.com/stanleyfok/content-based-recommender)
- Maintains backward compatibility with original API
- Added new language support without breaking existing functionality

## Historical Changes (from upstream)

This package is based on the original work by Stanley Fok.
For historical changes before the fork, see: https://github.com/stanleyfok/content-based-recommender

### Original Features (inherited)
- Content-based recommendation using TF-IDF and cosine similarity
- Support for unigram, bigram, and trigram processing
- Configurable vector sizes and similarity thresholds
- Bidirectional training capabilities
- Export/import functionality for model persistence
