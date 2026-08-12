/**
 * Autonomous AI Orchestrator — single entry point for 24/7 content lifecycle.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { PIPELINE_STAGES, PERFORMANCE } from "./config.mjs";
import { createPipelineRun, finishPipelineRun, logPipelineEvent } from "./audit.mjs";
import { runIngestPipelines, runPipelineStage } from "./stages.mjs";
import { rotateDailyContent } from "./daily.mjs";
import { processRetryQueue } from "./queue.mjs";
import { runSecurityAudit } from "./security.mjs";
import { generatePeriodicReport } from "./reports.mjs";

export async function runAutonomousOrchestrator(opts = {}) {
  const admin = getSupabaseAdmin();
  const started = Date.now();
  const run = await createPipelineRun(admin, opts.triggerType || "cron");
  const runId = run.id;

  const summary = {
    stagesCompleted: [],
    itemsDiscovered: 0,
    itemsPublished: 0,
    itemsRejected: 0,
    itemsUpdated: 0,
    errorCount: 0,
    report: {},
  };

  await logPipelineEvent(admin, {
    runId,
    stage: "discover",
    eventType: "orchestrator_start",
    message: `Autonomous orchestrator started (${opts.mode || "full"})`,
  });

  try {
    if (opts.mode === "daily" || opts.mode === "full") {
      const daily = await rotateDailyContent(admin, runId);
      summary.stagesCompleted.push("daily_content");
      summary.itemsPublished += daily.published || 0;
      summary.report.daily = daily;
    }

    if (opts.mode === "retry" || opts.mode === "full") {
      const retries = await processRetryQueue(admin, runId);
      summary.stagesCompleted.push("retry_queue");
      summary.report.retries = retries;
    }

    if (opts.mode === "ingest" || opts.mode === "full") {
      for (const stage of ["clean", "dedup"]) {
        await runPipelineStage(admin, runId, stage, { rawItems: [] });
        summary.stagesCompleted.push(stage);
      }

      const ingest = await runIngestPipelines(admin, runId, {
        triggerType: opts.triggerType || "cron",
        checkLinks: opts.checkLinks ?? false,
        skipAutoContent: opts.skipAutoContent ?? false,
        runScholarlyScan: opts.runScholarlyScan ?? (opts.triggerType === "daily"),
      });

      summary.itemsDiscovered += ingest.discovered || 0;
      summary.itemsPublished += ingest.published || 0;
      summary.itemsRejected += ingest.rejected || 0;
      summary.stagesCompleted.push("ingest", "publish", "index");

      if (!ingest.ok) summary.errorCount++;
      summary.report.ingest = ingest;
    }

    if (opts.mode === "security" || opts.mode === "full") {
      const security = await runSecurityAudit(admin);
      summary.stagesCompleted.push("security_audit");
      summary.report.security = security;
      if (security.criticalCount > 0) summary.errorCount += security.criticalCount;
    }

    if (opts.generateReport) {
      const report = await generatePeriodicReport(admin, opts.reportType || "daily");
      summary.report.periodic = report;
    }

    for (const stage of PIPELINE_STAGES) {
      if (!summary.stagesCompleted.includes(stage.id)) {
        await logPipelineEvent(admin, {
          runId,
          stage: stage.id,
          eventType: "stage_delegated",
          message: `Stage ${stage.label} handled by sub-engines`,
        });
      }
    }

    summary.stagesCompleted.push("audit");
    summary.durationMs = Date.now() - started;

    await finishPipelineRun(admin, runId, summary);

    return {
      ok: summary.errorCount === 0 || summary.itemsPublished > 0,
      runId,
      ...summary,
      automation_pct: Math.round((summary.stagesCompleted.length / PIPELINE_STAGES.length) * 100),
    };
  } catch (error) {
    summary.errorCount++;
    summary.durationMs = Date.now() - started;
    summary.report.error = error.message;

    await logPipelineEvent(admin, {
      runId,
      stage: "audit",
      eventType: "orchestrator_error",
      message: error.message,
      success: false,
    });

    await finishPipelineRun(admin, runId, summary);

    return { ok: false, runId, error: error.message, ...summary };
  }
}

export async function getOrchestratorStatus(admin) {
  if (!admin) {
    return { ok: false, reason: "no_admin" };
  }

  try {
    const { data: stats } = await admin.rpc("autonomous_platform_stats", { days: 7 });
    const { data: lastRun } = await admin
      .from("autonomous_pipeline_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      ok: true,
      stats: stats || {},
      lastRun,
      stages: PIPELINE_STAGES.length,
      maxDurationMs: PERFORMANCE.maxDurationMs,
    };
  } catch {
    return { ok: true, stats: {}, lastRun: null, stages: PIPELINE_STAGES.length };
  }
}
