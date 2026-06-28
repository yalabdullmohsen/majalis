/**
 * AKP v3 — Zero Manual Operation orchestrator.
 */
import { runAutonomousPlatform } from "../orchestrator.mjs";
import { listManagedSources } from "./source-manager.mjs";
import { runHealthMonitoringCycle } from "./health-monitor.mjs";
import { enforceDailyGoals, getDailyGoalProgress } from "./daily-goals.mjs";
import { buildProductionAnalytics } from "./analytics.mjs";
import { planNextRuns, shouldRunMode, getSchedulerState } from "./smart-scheduler.mjs";
import { healDeadLetterJobs, healWithRetry } from "./self-healing.mjs";
import { reindexRecentContent } from "./semantic-index.mjs";
import { runDailyBackupSnapshot } from "./backup-recovery.mjs";
import { logStructured } from "../monitoring.mjs";
import { seedContentSourcesFromJson } from "../sources.mjs";

export const PLATFORM_V3_VERSION = "3.0.0";

export async function runAutonomousPlatformV3(opts = {}) {
  const mode = opts.mode || "full";
  const started = Date.now();

  await logStructured({
    level: "info",
    component: "akp-v3",
    event: "cycle_start",
    metadata: { mode, version: PLATFORM_V3_VERSION },
  });

  if (mode === "seed") {
    const seeded = await seedContentSourcesFromJson();
    return { ok: seeded.ok, mode, seeded, platformVersion: PLATFORM_V3_VERSION };
  }

  if (mode === "analytics") {
    return buildProductionAnalytics();
  }

  if (mode === "health") {
    return runHealthMonitoringCycle(opts);
  }

  if (mode === "goals") {
    return enforceDailyGoals(opts);
  }

  if (mode === "backup") {
    return runDailyBackupSnapshot(opts.actor || "cron");
  }

  if (mode === "heal") {
    const dlq = await healDeadLetterJobs(opts);
    return { ok: true, dlq, platformVersion: PLATFORM_V3_VERSION };
  }

  const state = await getSchedulerState();
  const goals = await getDailyGoalProgress();
  const schedule = await planNextRuns({
    activeSources: (await listManagedSources()).sources?.length || 0,
    goalGap: goals.totalGap,
    recentErrors: 0,
  });

  const results = { schedule, goals };

  if (mode === "full" || mode === "fetch") {
    if (shouldRunMode("fetch", state)) {
      results.fetch = await healWithRetry(
        () => runAutonomousPlatform({ mode: "fetch", triggerType: opts.triggerType || "cron_v3" }),
        { component: "akp-fetch" },
      );
    }
  }

  if (mode === "full" || mode === "validate") {
    if (shouldRunMode("validate", state)) {
      results.validate = await healWithRetry(
        () => runAutonomousPlatform({ mode: "validate", triggerType: opts.triggerType || "cron_v3" }),
        { component: "akp-validate" },
      );
    }
  }

  if (mode === "full" || mode === "health") {
    results.health = await runHealthMonitoringCycle({ limit: opts.healthLimit || 10 });
  }

  if (mode === "full" || mode === "goals") {
    if (goals.totalGap > 0) {
      results.goals = await enforceDailyGoals({ maxExtraRuns: opts.maxExtraRuns || 2 });
    }
  }

  if (mode === "full" || mode === "reindex") {
    results.reindex = await reindexRecentContent({ limit: opts.reindexLimit || 50 });
  }

  if (mode === "full" || mode === "analytics") {
    results.analytics = await buildProductionAnalytics();
  }

  await logStructured({
    level: "info",
    component: "akp-v3",
    event: "cycle_complete",
    durationMs: Date.now() - started,
    metadata: { mode },
  });

  return {
    ok: true,
    platformVersion: PLATFORM_V3_VERSION,
    mode,
    durationMs: Date.now() - started,
    ...results,
  };
}

export {
  listManagedSources,
  buildProductionAnalytics,
  getDailyGoalProgress,
  runHealthMonitoringCycle,
};
