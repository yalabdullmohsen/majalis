/**
 * Autonomous Knowledge Platform v3 — public exports.
 */
export { PLATFORM_V3_VERSION, runAutonomousPlatformV3 } from "./orchestrator.mjs";
export {
  listManagedSources,
  getManagedSource,
  createManagedSource,
  upsertManagedSource,
  deleteManagedSource,
  toggleManagedSource,
  testManagedSource,
} from "./source-manager.mjs";
export { runHealthMonitoringCycle, evaluateSourceHealth, computeHealthScore, HEALTH_DISABLE_THRESHOLD } from "./health-monitor.mjs";
export { discoverFeedsFromUrl, listPendingDiscoveries, approveDiscovery, rejectDiscovery } from "./source-discovery.mjs";
export { scoreContentQuality, batchQualityCheck } from "./quality-engine.mjs";
export { semanticSearch, indexContentRecord, reindexRecentContent } from "./semantic-index.mjs";
export { linkPublishedContent, getKnowledgeGraphNeighbors } from "./knowledge-graph.mjs";
export { getPageRecommendations, getTrendingRecommendations } from "./recommendations.mjs";
export { planNextRuns, getSchedulerState, computeSmartSchedule, shouldRunMode } from "./smart-scheduler.mjs";
export { healWithRetry, healDeadLetterJobs, failoverSource } from "./self-healing.mjs";
export { buildProductionAnalytics, getAnalyticsHistory } from "./analytics.mjs";
export { getDailyGoalProgress, enforceDailyGoals } from "./daily-goals.mjs";
export { SUPPORTED_LANGUAGES, normalizeLanguageCode, buildI18nPayload } from "./i18n-foundation.mjs";
export { runDailyBackupSnapshot, listBackupSnapshots } from "./backup-recovery.mjs";
export { logAuditEvent, listAuditLog, sanitizeAdminPayload } from "./security.mjs";
export { buildAkpProductionHealth, AKP_V3_TABLES, AKP_V3_CRONS, INFRASTRUCTURE_REQUIREMENTS } from "./production-health.mjs";
export { SECRET_GUIDES } from "./infra-guides.mjs";
export { auditV3Migration } from "./migration-audit.mjs";
export { maybeRunAutoActivation } from "./auto-activation.mjs";
