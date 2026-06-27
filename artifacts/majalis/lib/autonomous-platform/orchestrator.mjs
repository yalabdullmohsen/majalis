/**
 * Autonomous Knowledge Platform — central orchestrator (Phase 2).
 */
import { PLATFORM_VERSION, CRON_SCHEDULES, CONTENT_PIPELINES } from "./config.mjs";
import {
  runContentPipeline,
  runAllPipelines,
  runFetchMode,
  runValidateMode,
  runReindexMode,
  runAuditMode,
  runCleanupMode,
} from "./pipelines/index.mjs";
import { ensurePlatformBootstrap, probePlatformTables } from "./bootstrap.mjs";
import { getPlatformDashboard, runHealthCheck, saveMetricsSnapshot, logStructured } from "./monitoring.mjs";
import { seedContentSourcesFromJson, syncSourcesToMkePlugins, listContentSources } from "./sources.mjs";

const MODE_HANDLERS = {
  bootstrap: (opts) => ensurePlatformBootstrap(opts),
  health: () => runHealthCheck(),
  dashboard: () => getPlatformDashboard(),
  fetch: (opts) => runFetchMode(opts),
  validate: (opts) => runValidateMode(opts),
  reindex: () => runReindexMode(),
  audit: () => runAuditMode(),
  cleanup: () => runCleanupMode(),
  full: (opts) => runFullCycle(opts),
  benefits: (opts) => runContentPipeline("benefits", opts),
  questions: (opts) => runContentPipeline("questions", opts),
  hadith: (opts) => runContentPipeline("hadith", opts),
  rulings: (opts) => runContentPipeline("rulings", opts),
  stories: (opts) => runContentPipeline("stories", opts),
  articles: (opts) => runContentPipeline("articles", opts),
  all: (opts) => runAllPipelines(opts),
};

export async function runAutonomousPlatform(opts = {}) {
  const mode = opts.mode || "full";
  const triggerType = opts.triggerType || "cron";
  const started = Date.now();

  await logStructured({
    level: "info",
    component: "orchestrator",
    event: "akp_start",
    metadata: { mode, triggerType, version: PLATFORM_VERSION },
  });

  const handler = MODE_HANDLERS[mode];
  if (!handler) {
    return { ok: false, error: "unknown_mode", mode, availableModes: Object.keys(MODE_HANDLERS) };
  }

  try {
    if (mode === "full" || mode === "fetch") {
      await seedContentSourcesFromJson();
      await syncSourcesToMkePlugins();
    }

    const result = await handler({ ...opts, triggerType });

    if (mode !== "dashboard" && mode !== "health") {
      await saveMetricsSnapshot("cron");
    }

    await logStructured({
      level: "info",
      component: "orchestrator",
      event: "akp_complete",
      durationMs: Date.now() - started,
      metadata: { mode, ok: result.ok !== false },
    });

    return {
      ok: result.ok !== false,
      platformVersion: PLATFORM_VERSION,
      mode,
      triggerType,
      durationMs: Date.now() - started,
      cronSchedules: CRON_SCHEDULES,
      pipelines: Object.keys(CONTENT_PIPELINES).length,
      ...result,
    };
  } catch (err) {
    await logStructured({
      level: "error",
      component: "orchestrator",
      event: "akp_failed",
      message: String(err.message || err),
      metadata: { mode },
    });
    return { ok: false, error: String(err.message || err), mode, platformVersion: PLATFORM_VERSION };
  }
}

async function runFullCycle(opts) {
  const fetch = await runFetchMode(opts);
  const validate = await runValidateMode({ batchSize: 10 });
  const pipelines = {};

  for (const type of ["benefits", "questions", "hadith"]) {
    pipelines[type] = await runContentPipeline(type, { ...opts, maxItems: 5 });
  }

  return { ok: true, fetch, validate, pipelines };
}

export {
  PLATFORM_VERSION,
  CRON_SCHEDULES,
  CONTENT_PIPELINES,
  getPlatformDashboard,
  runHealthCheck,
  ensurePlatformBootstrap,
  probePlatformTables,
  listContentSources,
};
