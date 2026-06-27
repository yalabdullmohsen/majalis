/**
 * Trusted Knowledge Network — Phase 5 public API.
 */
export { TKN_VERSION, SUPPORTED_SOURCE_TYPES, SOURCE_TYPE_LABELS, PIPELINE_STAGES, DEFAULT_DAILY_QUOTAS } from "./config.mjs";
export { loadPlatformSettings, updatePlatformSettings, getQuotaForPipeline } from "./settings.mjs";
export { listConnectors, fetchFromConnector } from "./connectors/index.mjs";
export { processContentItem, syncSourceNow, normalizeRecord, extractKeywords, classifyRecord } from "./pipeline.mjs";
export {
  listSourcesWithStats,
  upsertContentSource,
  toggleSource,
  listSourceOperations,
  getSourceById,
  listConnectors as listSourceConnectors,
} from "./sources.mjs";
export {
  getTknDashboard,
  runHealthCheck,
  processRetryQueue,
  logSourceOperation,
  enqueueRetry,
} from "./monitoring.mjs";
export { buildRelatedSections } from "./search.mjs";

export async function runTknPipeline(contentType, opts = {}) {
  const { runContentPipeline } = await import("../autonomous-platform/pipelines/index.mjs");
  return runContentPipeline(contentType, { ...opts, triggerType: opts.triggerType || "tkn" });
}

export async function runTknFetch(opts = {}) {
  const { fetchAllDueSources } = await import("../autonomous-platform/fetch.mjs");
  return fetchAllDueSources(opts.contentType);
}
