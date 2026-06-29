import * as sourceRegistry from "./source-registry.mjs";
import * as fetchEngine from "./fetch-engine.mjs";
import * as parserEngine from "./parser-engine.mjs";
import * as normalizationEngine from "./normalization-engine.mjs";
import * as aiClassificationEngine from "./ai-classification-engine.mjs";
import * as deduplicationEngine from "./deduplication-engine.mjs";
import * as qualityEngine from "./quality-engine.mjs";
import * as reviewQueue from "./review-queue.mjs";
import * as cmsDispatcher from "./cms-dispatcher.mjs";
import * as searchIndex from "./search-index.mjs";

/** @type {Record<string, { getStatus: Function }>} */
export const LAYER_MODULES = {
  source_registry: sourceRegistry,
  fetch_engine: fetchEngine,
  parser_engine: parserEngine,
  normalization_engine: normalizationEngine,
  ai_classification_engine: aiClassificationEngine,
  deduplication_engine: deduplicationEngine,
  quality_engine: qualityEngine,
  review_queue: reviewQueue,
  cms_dispatcher: cmsDispatcher,
  search_index: searchIndex,
};

export {
  sourceRegistry,
  fetchEngine,
  parserEngine,
  normalizationEngine,
  aiClassificationEngine,
  deduplicationEngine,
  qualityEngine,
  reviewQueue,
  cmsDispatcher,
  searchIndex,
};
