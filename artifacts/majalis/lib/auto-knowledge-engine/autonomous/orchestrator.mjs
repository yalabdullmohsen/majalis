/**
 * Unified autonomous platform cycle — AKE + content engines + monitoring + reports.
 */

import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { runContinuousAkeCycle } from "../continuous-cycle.mjs";
import { runAllContentEngines } from "../../content-engines/orchestrator.mjs";
import { evaluateMonitoringRules } from "../monitoring/rules.mjs";
import { generatePeriodicReport } from "./reporting.mjs";
import { getAutonomousDashboard } from "./dashboard.mjs";
import { akeLog } from "../monitoring.mjs";

export async function runAutonomousPlatformCycle(options = {}) {
  const started = Date.now();
  const admin = getSupabaseAdmin();
  const results = {
    ok: true,
    at: new Date().toISOString(),
    ake: null,
    contentEngines: null,
    monitoring: null,
    reports: [],
    durationMs: 0,
  };

  try {
    results.ake = await runContinuousAkeCycle({
      triggerType: options.triggerType || "cron",
      maxItemsPerConnector: options.maxItemsPerConnector,
      budgetMs: options.akeBudgetMs || 55_000,
    });

    if (options.includeContentEngines !== false) {
      results.contentEngines = await runAllContentEngines({
        runType: options.runType || "cron",
        engineIds: options.engineIds,
      });
    }

    results.monitoring = await evaluateMonitoringRules({
      lastPublishedAt: results.ake?.published > 0 ? new Date().toISOString() : undefined,
      aiDown: options.aiDown,
    });

    if (options.generateHourlyReport) {
      const hourly = await generatePeriodicReport("hourly");
      results.reports.push(hourly);
    }
  } catch (err) {
    results.ok = false;
    results.error = err.message;
    akeLog("autonomous-cycle", { error: err.message }, "error");
  }

  results.durationMs = Date.now() - started;
  results.ok = results.ok && (results.ake?.ok !== false);

  if (admin) {
    try {
      await admin.from("ake_engine_runs").insert({
        trigger_type: options.triggerType || "cron",
        status: results.ok ? "completed" : "failed",
        cycle_type: "autonomous_platform",
        published_count: (results.ake?.published || 0) + (results.contentEngines?.aggregate?.items_published || 0),
        fetched_count: results.ake?.fetched || 0,
        duration_ms: results.durationMs,
        finished_at: new Date().toISOString(),
        summary: results,
      });
    } catch {
      /* optional */
    }
  }

  return results;
}

export { getAutonomousDashboard };
