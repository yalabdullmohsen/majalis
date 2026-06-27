/**
 * Majlis Knowledge Engine — public API (v2).
 */
export {
  runMajlisKnowledgeEngine,
  runMkeHealthCheck,
  getEngineMetrics,
  listRegisteredSources,
  upsertSourcePlugin,
  analyzeImage,
  analyzeContentItem,
  getVisionStatus,
  makeContentDecision,
  runQualityChecks,
} from "./orchestrator.mjs";

export {
  ENGINE_VERSION,
  SUPPORTED_SOURCE_TYPES,
  PIPELINE_STAGES,
  DECISIONS,
  INTELLIGENCE_LAYERS,
} from "./config.mjs";

export { listSupportedPlatforms } from "./source-registry.mjs";
export { getPlatformMonitoring } from "./monitoring-intelligence.mjs";
export { intelligentSearch, getSearchCapabilities } from "./search-intelligence.mjs";
export { recommendForLesson, recommendForUser } from "./recommendation-engine.mjs";
export { runSelfHealing, resolveActiveAiProvider } from "./self-healing.mjs";
export { runQualityEngine } from "./quality-engine.mjs";
export { makeMultiStageDecision } from "./decision-engine-v2.mjs";
export { analyzeContentItemV2, analyzeImageV2 } from "./vision-intelligence-v2.mjs";
export { buildPriorityQueue, computeCompositeScore } from "./discovery-intelligence.mjs";
