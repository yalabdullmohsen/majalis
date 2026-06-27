/**
 * Content Scheduler — autonomous job orchestrator.
 */
import { SCHEDULER_JOBS, PIPELINES, listPipelineIds } from "./config.mjs";
import { runSourceIngest, checkSourceHealth } from "./sources.mjs";
import { runPipeline, processAllPending } from "./pipelines/base-pipeline.mjs";
import { runReindex, flagIndexingNeeded } from "./indexing.mjs";
import {
  logEvent,
  processRetryQueue,
  getObservability,
  cleanupOldLogs,
  cleanupDeadLetter,
  recordHealthCheck,
  createAlert,
} from "./monitoring.mjs";

async function startRun(admin, jobId) {
  const { data, error } = await admin
    .from("content_scheduler_runs")
    .insert({ job_id: jobId, status: "running" })
    .select("id")
    .maybeSingle();
  if (error) throw error;
  await admin
    .from("content_scheduler_jobs")
    .update({ last_run_at: new Date().toISOString(), last_status: "running" })
    .eq("id", jobId);
  return data.id;
}

async function finishRun(admin, runId, jobId, result) {
  const finished = new Date().toISOString();
  await admin
    .from("content_scheduler_runs")
    .update({
      status: result.error ? "failed" : result.partial ? "partial" : "success",
      finished_at: finished,
      duration_ms: result.duration_ms,
      items_processed: result.items_processed || 0,
      items_published: result.items_published || 0,
      items_rejected: result.items_rejected || 0,
      items_duplicate: result.items_duplicate || 0,
      error_message: result.error || null,
      report: result.report || {},
    })
    .eq("id", runId);

  await admin
    .from("content_scheduler_jobs")
    .update({
      last_success_at: result.error ? undefined : finished,
      last_duration_ms: result.duration_ms,
      last_status: result.error ? "failed" : "success",
      updated_at: finished,
    })
    .eq("id", jobId);
}

export async function runSourceCheck(admin) {
  const start = Date.now();
  const runId = admin ? await startRun(admin, "source-check") : null;
  const report = { sources: [], staged: 0, errors: [] };

  let sources = [];
  if (admin) {
    const { data } = await admin.from("content_pipeline_sources").select("*").eq("active", true);
    sources = data || [];
  }

  for (const source of sources) {
    const health = await checkSourceHealth(admin, source);
    await recordHealthCheck(admin, `source:${source.slug}`, health.healthy ? "healthy" : "unhealthy", health);
    if (!health.healthy) {
      report.errors.push({ slug: source.slug, error: health.error || health.status });
      continue;
    }
    try {
      const ingested = await runSourceIngest(admin, source);
      report.sources.push({ slug: source.slug, ...ingested });
      report.staged += ingested.staged || 0;
    } catch (err) {
      report.errors.push({ slug: source.slug, error: err.message });
    }
  }

  await logEvent(admin, {
    runId,
    stage: "source-check",
    message: `Checked ${sources.length} sources, staged ${report.staged}`,
    metadata: report,
    durationMs: Date.now() - start,
  });

  const result = {
    items_processed: sources.length,
    items_published: report.staged,
    duration_ms: Date.now() - start,
    report,
    partial: report.errors.length > 0,
  };
  if (admin && runId) await finishRun(admin, runId, "source-check", result);
  return { ok: true, job: "source-check", ...result };
}

export async function runContentUpdate(admin) {
  const start = Date.now();
  const runId = admin ? await startRun(admin, "content-update") : null;

  const retry = await processRetryQueue(admin, 10);
  const processed = admin ? await processAllPending(admin, { runId, limit: 150 }) : { processed: 0, published: 0 };

  await logEvent(admin, {
    runId,
    stage: "content-update",
    message: `Processed ${processed.processed}, published ${processed.published}`,
    metadata: { retry, processed },
    durationMs: Date.now() - start,
  });

  const result = {
    items_processed: processed.processed,
    items_published: processed.published,
    items_rejected: processed.rejected || 0,
    items_duplicate: processed.duplicate || 0,
    duration_ms: Date.now() - start,
    report: { retry, processed },
  };
  if (admin && runId) await finishRun(admin, runId, "content-update", result);
  return { ok: true, job: "content-update", ...result };
}

export async function runReindexJob(admin) {
  const start = Date.now();
  const runId = admin ? await startRun(admin, "reindex") : null;
  const reindex = await runReindex(admin);
  await flagIndexingNeeded(admin);

  const result = { duration_ms: Date.now() - start, report: reindex };
  if (admin && runId) await finishRun(admin, runId, "reindex", result);
  return { ok: true, job: "reindex", ...result };
}

export async function runDailyProduction(admin) {
  const start = Date.now();
  const runId = admin ? await startRun(admin, "daily-production") : null;
  const pipelines = SCHEDULER_JOBS["daily-production"].pipelines;
  const results = {};

  let totalPublished = 0;
  let totalProcessed = 0;

  for (const pipelineId of pipelines) {
    if (pipelineId === "all") continue;
    if (!admin) continue;
    results[pipelineId] = await runPipeline(admin, pipelineId, { runId });
    totalPublished += results[pipelineId].published || 0;
    totalProcessed += results[pipelineId].processed || 0;
  }

  await logEvent(admin, {
    runId,
    stage: "daily-production",
    message: `Daily production: ${totalPublished} published`,
    metadata: results,
    durationMs: Date.now() - start,
  });

  const result = {
    items_processed: totalProcessed,
    items_published: totalPublished,
    duration_ms: Date.now() - start,
    report: results,
  };
  if (admin && runId) await finishRun(admin, runId, "daily-production", result);
  return { ok: true, job: "daily-production", ...result };
}

export async function runQualityReview(admin) {
  const start = Date.now();
  const runId = admin ? await startRun(admin, "quality-review") : null;
  const report = { pipelines: {}, reviewQueue: 0 };

  if (admin) {
    for (const pipelineId of listPipelineIds()) {
      const { count } = await admin
        .from("content_production_published")
        .select("*", { count: "exact", head: true })
        .eq("pipeline", pipelineId)
        .gte("published_at", new Date(Date.now() - 7 * 86400000).toISOString());
      report.pipelines[pipelineId] = { published_7d: count || 0 };
    }
    const { count: reviewCount } = await admin
      .from("content_production_review_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    report.reviewQueue = reviewCount || 0;

    if (reviewCount > 50) {
      await createAlert(admin, {
        severity: "warning",
        title: "طابور المراجعة ممتلئ",
        message: `${reviewCount} عنصر بانتظار المراجعة`,
      });
    }
  }

  const result = { duration_ms: Date.now() - start, report };
  if (admin && runId) await finishRun(admin, runId, "quality-review", result);
  return { ok: true, job: "quality-review", ...result };
}

export async function runCleanup(admin) {
  const start = Date.now();
  const runId = admin ? await startRun(admin, "cleanup") : null;
  const logs = await cleanupOldLogs(admin);
  const dlq = await cleanupDeadLetter(admin);

  const result = {
    duration_ms: Date.now() - start,
    report: { logs_deleted: logs.deleted, dlq_deleted: dlq.deleted },
  };
  if (admin && runId) await finishRun(admin, runId, "cleanup", result);
  return { ok: true, job: "cleanup", ...result };
}

const JOB_HANDLERS = {
  "source-check": runSourceCheck,
  "content-update": runContentUpdate,
  reindex: runReindexJob,
  "daily-production": runDailyProduction,
  "quality-review": runQualityReview,
  cleanup: runCleanup,
};

export async function runSchedulerJob(jobId, admin) {
  const handler = JOB_HANDLERS[jobId];
  if (!handler) throw new Error(`Unknown scheduler job: ${jobId}`);
  return handler(admin);
}

export async function getSchedulerDashboard(admin) {
  const observability = await getObservability(admin);

  let jobs = [];
  let stats = [];
  let sources = [];

  if (admin) {
    const [jobsRes, statsRes, sourcesRes] = await Promise.all([
      admin.from("content_scheduler_jobs").select("*").order("id"),
      admin.from("content_production_daily_stats").select("*").order("stat_date", { ascending: false }).limit(60),
      admin.from("content_pipeline_sources").select("*").order("pipeline"),
    ]);
    jobs = jobsRes.data || [];
    stats = statsRes.data || [];
    sources = sourcesRes.data || [];
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayStats = stats.filter((s) => s.stat_date === today);
  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const weekStats = stats.filter((s) => s.stat_date >= weekStart);
  const monthStart = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const monthStats = stats.filter((s) => s.stat_date >= monthStart);

  const sum = (rows, field) => rows.reduce((a, r) => a + (r[field] || 0), 0);

  return {
    jobs,
    sources,
    pipelines: PIPELINES,
    production: {
      today: {
        produced: sum(todayStats, "produced"),
        published: sum(todayStats, "published"),
        rejected: sum(todayStats, "rejected"),
        duplicate: sum(todayStats, "duplicate"),
        byPipeline: todayStats,
      },
      week: {
        produced: sum(weekStats, "produced"),
        published: sum(weekStats, "published"),
        rejected: sum(weekStats, "rejected"),
      },
      month: {
        produced: sum(monthStats, "produced"),
        published: sum(monthStats, "published"),
        rejected: sum(monthStats, "rejected"),
      },
    },
    observability,
    readiness: computeReadiness(jobs, sources, observability),
  };
}

function computeReadiness(jobs, sources, observability) {
  const activeSources = sources.filter((s) => s.active).length;
  const healthyJobs = jobs.filter((j) => j.last_status === "success").length;
  const openAlerts = (observability.alerts || []).length;
  const score = Math.min(
    100,
    Math.round(
      (activeSources > 0 ? 30 : 0) +
        (healthyJobs / Math.max(jobs.length, 1)) * 40 +
        (openAlerts === 0 ? 30 : Math.max(0, 30 - openAlerts * 5)),
    ),
  );
  return { score, activeSources, healthyJobs, openAlerts };
}

export { SCHEDULER_JOBS, PIPELINES, JOB_HANDLERS };
