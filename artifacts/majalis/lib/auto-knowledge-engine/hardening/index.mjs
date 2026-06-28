/**
 * AKE Production Hardening — module index.
 */

export { migrateFiqhFromLibraryItems, getFiqhMigrationStatus } from "./fiqh-migration.mjs";
export { fetchFeedWithReliability, cacheSuccessfulFeedUrl, markFeedDegraded, checkDegradedFeedAlert } from "./rss-reliability.mjs";
export { withAdaptiveRetry, classifyRetryError, adaptiveRetryDelay, shouldRequeueJob, nextJobSchedule } from "./adaptive-retry.mjs";
export { detectSmartDuplicate, normalizeText, titleSimilarity } from "./semantic-dedup.mjs";
export { updateConnectorIntelligence, getConnectorHealthPanel, computeConnectorHealthSnapshot } from "./connector-health.mjs";
export { enrichAnalysisMetadata, mergeRelatedContent } from "./ai-enrichment.mjs";
export { runSourceDiscoveryCycle, getPendingDiscoveredSources, crawlOrganizationForSources } from "./source-discovery.mjs";
export { snapshotPublishingAnalytics, getAnalyticsDashboard, collectPublishingMetrics } from "./analytics.mjs";
export { runIncidentRecoveryCycle, getWorkerStatus, getOpenIncidents, heartbeatWorker } from "./incident-recovery.mjs";
export { notifyHardeningAlert, evaluateHardeningAlerts } from "./notifications.mjs";
export { getHardeningDashboard, ensureHardeningSchema } from "./dashboard.mjs";
