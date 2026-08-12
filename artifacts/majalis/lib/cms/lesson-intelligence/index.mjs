/**
 * Phase 6 — Lesson Intelligence Engine (public API).
 */
export {
  runLessonIntelligenceEngine,
  processIntelligenceItem,
  getIntelligenceCenterStats,
} from "./engine.mjs";

export {
  listLessonSources,
  getLessonSource,
  upsertLessonSource,
  getSourcesDueForScan,
} from "./sources.mjs";

export { findIntelligenceDuplicate, fieldCompletenessScore } from "./dedup-engine.mjs";
export { computeSourceTrustScore, computeExtractionConfidence, shouldAutoPublishIntelligence } from "./trust-scorer.mjs";
export { runExtractionPipeline, selectExtractorsForSource, EXTRACTOR_IDS } from "./extractors/index.mjs";
export { discoverViaAdapter, listSupportedAdapters, lessonSourceToConnectorSource } from "./adapters/index.mjs";
export { resolveEntities } from "./entity-resolver.mjs";
export { fuzzySimilarity, levenshtein, compositeLessonKey } from "./text-utils.mjs";
