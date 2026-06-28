/**
 * Monitoring — structured logs, DLQ, alerts, metrics, health checks.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { CONTENT_PIPELINES, CRON_SCHEDULES, PLATFORM_VERSION, DAILY_QUOTAS } from "./config.mjs";
import { kuwaitDateString, periodStart } from "./normalize.mjs";
import { getQueueStats } from "../majlis-knowledge-engine/queue.mjs";
import { getRetryQueueStats } from "./recovery.mjs";
import { listContentSources } from "./sources.mjs";
import { getDailyTargets } from "./production-scheduler.mjs";

export async function logStructured({ level = "info", component, event, message, pipeline, runId, durationMs, metadata = {} }) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.log(JSON.stringify({ level, component, event, message, pipeline, runId, durationMs, ...metadata }));
    return;
  }
  try {
    await admin.from("akp_structured_logs").insert({
      level,
      component,
      event,
      message: message || null,
      pipeline: pipeline || null,
      run_id: runId || null,
      duration_ms: durationMs || null,
      metadata,
    });
  } catch {
    console.log(JSON.stringify({ level, component, event, message, pipeline }));
  }
}

export async function moveToDeadLetter({ queueName, jobType, payload, error, retryCount, originalJobId, failureReason }) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false };

  try {
    const { data, error: insertErr } = await admin.from("akp_dead_letter_jobs").insert({
      queue_name: queueName || "akp",
      job_type: jobType,
      payload: payload || {},
      error: String(error),
      retry_count: retryCount ?? 0,
      original_job_id: originalJobId || null,
      failure_reason: failureReason || null,
    }).select("id").single();
    if (insertErr) throw insertErr;

    await createAlert({
      severity: "error",
      component: queueName || "akp",
      title: `DLQ: ${jobType}`,
      message: String(error),
      metadata: { dlqId: data.id },
    });

    return { ok: true, dlqId: data.id };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

export async function createAlert({ severity, component, title, message, metadata = {} }) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin.from("akp_alerts").insert({
      severity: severity || "warning",
      component,
      title,
      message,
      metadata,
    });
  } catch {
    /* optional */
  }
}

async function countSince(table, since, filter = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return 0;
  try {
    let q = admin.from(table).select("id", { count: "exact", head: true }).gte("created_at", since);
    for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    const { count } = await q;
    return count || 0;
  } catch {
    return 0;
  }
}

async function countPublishedToday(contentType) {
  const pipeline = CONTENT_PIPELINES[contentType];
  if (!pipeline) return 0;
  const since = periodStart("daily");
  const admin = getSupabaseAdmin();
  if (!admin) return 0;
  try {
    const { count } = await admin
      .from(pipeline.targetTable)
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    return count || 0;
  } catch {
    return 0;
  }
}

export async function getPlatformDashboard() {
  const admin = getSupabaseAdmin();
  const today = periodStart("daily");
  const weekStart = periodStart("weekly");
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const pipelineStats = {};
  for (const [type, pipeline] of Object.entries(CONTENT_PIPELINES)) {
    pipelineStats[type] = {
      label: pipeline.label,
      quota: pipeline.quota,
      quotaPeriod: pipeline.quotaPeriod,
      publishedToday: await countPublishedToday(type),
    };
  }

  let mkeStats = {};
  let akpStats = {};
  if (admin) {
    try {
      const [runs, jobs, decisions, quality, plugins, sources, dlq, review, alerts] = await Promise.all([
        countSince("mke_runs", today),
        admin.from("mke_queue_jobs").select("status", { count: "exact" }).then(async () => {
          const pending = await countSince("mke_queue_jobs", today, { status: "pending" });
          const failed = await countSince("mke_queue_jobs", today, { status: "failed" });
          return { pending, failed };
        }).catch(() => ({ pending: 0, failed: 0 })),
        countSince("mke_decisions", today),
        countSince("mke_quality_reports", today),
        countSince("mke_source_plugins", "1970-01-01"),
        countSince("akp_content_sources", "1970-01-01"),
        countSince("akp_dead_letter_jobs", weekStart),
        countSince("akp_review_queue", today, { status: "pending" }),
        countSince("akp_alerts", weekStart, { resolved: false }),
      ]);

      mkeStats = { runsToday: runs, decisionsToday: decisions, qualityReportsToday: quality, sourcePlugins: plugins };
      akpStats = { sources, dlqJobs: dlq, reviewPending: review, unresolvedAlerts: alerts, ...jobs };
    } catch {
      /* tables optional */
    }
  }

  let lastRun = null;
  let lastError = null;
  if (admin) {
    try {
      const { data: run } = await admin.from("mke_runs").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle();
      lastRun = run;
      const { data: errLog } = await admin.from("akp_structured_logs").select("*").eq("level", "error").order("created_at", { ascending: false }).limit(1).maybeSingle();
      lastError = errLog;
    } catch {
      /* optional */
    }
  }

  const queue = await getQueueStats().catch(() => ({ pending: 0, failed: 0 }));
  const retryQueue = await getRetryQueueStats();
  const sources = await listContentSources({ activeOnly: true });
  const dailyTargets = getDailyTargets();

  let pipelineRuns = [];
  let avgDurationMs = 0;
  let sourceHealthRows = [];
  let duplicateCount = 0;

  if (admin) {
    try {
      const { data: runs } = await admin
        .from("akp_pipeline_runs")
        .select("*")
        .gte("started_at", today)
        .order("started_at", { ascending: false })
        .limit(20);
      pipelineRuns = runs || [];
      const durations = pipelineRuns.filter((r) => r.duration_ms).map((r) => r.duration_ms);
      avgDurationMs = durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      const { data: health } = await admin
        .from("akp_source_health")
        .select("*")
        .order("checked_at", { ascending: false })
        .limit(sources.length * 2);
      sourceHealthRows = health || [];

      duplicateCount = await countSince("akp_duplicate_history", today);
    } catch {
      /* optional tables */
    }
  }

  const sourceStatuses = sources.map((s) => {
    const latest = sourceHealthRows.find((h) => h.source_slug === s.slug);
    return {
      slug: s.slug,
      name: s.name,
      status: latest?.status || (s.last_error ? "dead" : "unknown"),
      latencyMs: latest?.latency_ms,
      lastError: s.last_error,
      lastFetch: s.last_fetch_at,
    };
  });

  return {
    platformVersion: PLATFORM_VERSION,
    date: kuwaitDateString(),
    pipelines: pipelineStats,
    quotas: DAILY_QUOTAS,
    dailyTargets,
    cronSchedules: CRON_SCHEDULES,
    pipelineRuns,
    avgDurationMs,
    sourceStatuses,
    counts: {
      today: {
        items: Object.values(pipelineStats).reduce((a, p) => a + (p.publishedToday || 0), 0),
        mkeRuns: mkeStats.runsToday || 0,
        decisions: mkeStats.decisionsToday || 0,
      },
      sources: akpStats.sources || sources.length || mkeStats.sourcePlugins || 0,
      sourcesHealthy: sourceStatuses.filter((s) => s.status === "available" || s.status === "slow").length,
      sourcesDead: sourceStatuses.filter((s) => s.status === "dead" || s.status === "blocked").length,
      queuePending: queue.pending || akpStats.pending || 0,
      queueFailed: queue.failed || akpStats.failed || 0,
      retryQueue: retryQueue.total || 0,
      retryPending: retryQueue.pending || 0,
      rejected: await countSince("akp_review_queue", today, { status: "rejected" }),
      published: Object.values(pipelineStats).reduce((a, p) => a + (p.publishedToday || 0), 0),
      duplicates: duplicateCount,
      dlq: akpStats.dlqJobs || 0,
      reviewPending: akpStats.reviewPending || 0,
      alerts: akpStats.unresolvedAlerts || 0,
    },
    lastRun,
    lastError,
    health: {
      database: admin ? "connected" : "missing_admin",
      mke: lastRun ? "active" : "no_runs",
      automation: (mkeStats.runsToday || 0) > 0 ? "running" : "idle",
      score: computeHealthScore({ admin, sourceStatuses, akpStats, queue, retryQueue }),
    },
    services: {
      mke: { status: admin ? "ok" : "degraded", runs: mkeStats.runsToday || 0 },
      fetch: { status: "ok", schedule: CRON_SCHEDULES.fetch.schedule },
      validate: { status: "ok", schedule: CRON_SCHEDULES.validate.schedule },
      publisher: { status: admin ? "ok" : "degraded" },
      dedup: { status: "ok" },
      search: { status: process.env.OPENAI_API_KEY ? "embeddings" : "keyword_fallback" },
    },
    retryQueue,
    lastErrorStack: lastError?.metadata?.stack || null,
    productionVelocity: computeVelocity(pipelineStats),
    readinessPct: computeReadiness({ admin, mkeStats, akpStats, lastRun }),
  };
}

function computeVelocity(pipelineStats) {
  const total = Object.values(pipelineStats).reduce((a, p) => a + (p.publishedToday || 0), 0);
  const quotaTotal = Object.values(pipelineStats).reduce((a, p) => a + (p.quota || 0), 0);
  return {
    itemsToday: total,
    quotaTotal,
    pctOfQuota: quotaTotal ? Math.round((total / quotaTotal) * 100) : 0,
  };
}

function computeHealthScore({ admin, sourceStatuses, akpStats, queue, retryQueue }) {
  let score = 0;
  if (admin) score += 15;
  const healthy = sourceStatuses.filter((s) => s.status === "available" || s.status === "slow").length;
  const total = sourceStatuses.length || 1;
  score += Math.round((healthy / total) * 25);
  if ((akpStats.dlqJobs || 0) < 10) score += 15;
  else if ((akpStats.dlqJobs || 0) < 50) score += 8;
  if ((retryQueue.total || 0) < 100) score += 15;
  if ((queue.pending || 0) < 500) score += 15;
  if ((akpStats.unresolvedAlerts || 0) < 5) score += 15;
  return Math.min(100, score);
}

function computeReadiness({ admin, mkeStats, akpStats, lastRun }) {
  let score = 0;
  if (admin) score += 20;
  if (mkeStats.sourcePlugins || akpStats.sources) score += 15;
  if (lastRun) score += 20;
  if ((mkeStats.runsToday || 0) > 0) score += 15;
  if (akpStats.sources >= 3) score += 15;
  score += 15; // code + CI present
  return Math.min(100, score);
}

export async function saveMetricsSnapshot(type = "hourly") {
  const dashboard = await getPlatformDashboard();
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false };
  try {
    await admin.from("akp_metrics_snapshots").insert({
      snapshot_type: type,
      metrics: dashboard,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function runHealthCheck() {
  const dashboard = await getPlatformDashboard();
  const ok = dashboard.health.database === "connected"
    && (dashboard.health.score ?? 0) >= 50
    && (dashboard.counts?.sourcesDead ?? 0) < (dashboard.counts?.sources ?? 1);
  return { ok, ...dashboard.health, platformVersion: PLATFORM_VERSION, counts: dashboard.counts };
}
