/**
 * Autonomous Knowledge Platform — public API.
 */
export { DAILY_QUOTAS, WEEKLY_QUOTAS } from "./config.mjs";
export {
  runAutonomousPlatform,
  getPlatformDashboard,
  runHealthCheck,
  ensurePlatformBootstrap,
  probePlatformTables,
  listContentSources,
  PLATFORM_VERSION,
  CRON_SCHEDULES,
  CONTENT_PIPELINES,
} from "./orchestrator.mjs";

export { seedContentSourcesFromJson, upsertContentSource, syncSourcesToMkePlugins } from "./sources.mjs";
export { runContentPipeline, runAllPipelines } from "./pipelines/index.mjs";
export { checkDuplicate, registerFingerprint } from "./dedup.mjs";
export { verifyContent, enqueueReview } from "./verification.mjs";
export { publishContentRecord } from "./publisher.mjs";
export { logStructured, getPlatformDashboard as getAkpDashboard, moveToDeadLetter, createAlert } from "./monitoring.mjs";
