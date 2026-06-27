/**
 * TKN monitoring — operations log, retry queue, stage logs, health.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { logStructured, moveToDeadLetter, createAlert } from "../autonomous-platform/monitoring.mjs";
import { getQueueStats } from "../majlis-knowledge-engine/queue.mjs";
import { getPlatformDashboard } from "../autonomous-platform/monitoring.mjs";
import { loadPlatformSettings } from "./settings.mjs";
import { TKN_VERSION, PIPELINE_STAGES } from "./config.mjs";

export { logStructured, moveToDeadLetter, createAlert };

export async function logSourceOperation(opts) {
  const admin = getSupabaseAdmin();
  const row = {
    source_id: opts.source?.id || opts.sourceId || null,
    source_slug: opts.source?.slug || opts.sourceSlug || null,
    operation: opts.operation || "sync",
    status: opts.status || "started",
    items_found: opts.itemsFound ?? 0,
    items_processed: opts.itemsProcessed ?? 0,
    items_published: opts.itemsPublished ?? 0,
    items_duplicate: opts.itemsDuplicate ?? 0,
    items_rejected: opts.itemsRejected ?? 0,
    duration_ms: opts.durationMs ?? null,
    error_message: opts.errorMessage || null,
    metadata: opts.metadata || {},
    triggered_by: opts.triggeredBy || "system",
    finished_at: opts.status === "completed" || opts.status === "failed" ? new Date().toISOString() : null,
  };

  if (admin) {
    try {
      if (opts.id) {
        await admin.from("tkn_source_operations_log").update(row).eq("id", opts.id);
        return opts.id;
      }
      const { data } = await admin.from("tkn_source_operations_log").insert(row).select("id").single();
      return data?.id || null;
    } catch {
      /* optional */
    }
  }
  console.log(JSON.stringify({ tkn: "source_op", ...row }));
  return null;
}

export async function logStage(opts) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin.from("tkn_pipeline_stage_logs").insert({
      run_id: opts.runId || null,
      pipeline: opts.pipeline,
      stage: opts.stage,
      status: opts.status || "completed",
      duration_ms: opts.durationMs || 0,
      items_in: opts.itemsIn ?? 0,
      items_out: opts.itemsOut ?? 0,
      metadata: opts.metadata || {},
    });
  } catch {
    /* optional */
  }
}

export async function enqueueRetry({ jobType, payload, error, sourceId, sourceSlug, maxRetries = 3 }) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return moveToDeadLetter({ queueName: "tkn-retry", jobType, payload, error, failureReason: "no_admin" });
  }
  try {
    const { data } = await admin.from("tkn_retry_queue").insert({
      job_type: jobType,
      payload,
      last_error: String(error),
      source_id: sourceId || null,
      source_slug: sourceSlug || null,
      max_retries: maxRetries,
      next_retry_at: new Date(Date.now() + 5000).toISOString(),
    }).select("id").single();
    return { ok: true, retryId: data?.id };
  } catch (err) {
    return moveToDeadLetter({ queueName: "tkn-retry", jobType, payload, error: err.message });
  }
}

export async function processRetryQueue(batchSize = 10) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, processed: 0 };

  const { data: jobs } = await admin
    .from("tkn_retry_queue")
    .select("*")
    .in("status", ["pending", "retrying"])
    .lte("next_retry_at", new Date().toISOString())
    .order("next_retry_at", { ascending: true })
    .limit(batchSize);

  let processed = 0;
  let failed = 0;

  for (const job of jobs || []) {
    if (job.retry_count >= job.max_retries) {
      await admin.from("tkn_retry_queue").update({ status: "dead_letter", updated_at: new Date().toISOString() }).eq("id", job.id);
      await moveToDeadLetter({ queueName: "tkn-retry", jobType: job.job_type, payload: job.payload, error: job.last_error, retryCount: job.retry_count });
      failed += 1;
      continue;
    }

    await admin.from("tkn_retry_queue").update({
      status: "retrying",
      retry_count: job.retry_count + 1,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);

    processed += 1;
  }

  return { ok: true, processed, failed, pending: (jobs?.length || 0) - processed };
}

async function countTable(table, filter = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return 0;
  try {
    let q = admin.from(table).select("id", { count: "exact", head: true });
    for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    const { count } = await q;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function getTknDashboard() {
  const akpDashboard = await getPlatformDashboard();
  const queueStats = await getQueueStats().catch(() => ({ pending: 0, failed: 0, completed: 0 }));
  const settings = await loadPlatformSettings();
  const admin = getSupabaseAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  let retryPending = 0;
  let opsToday = 0;
  let avgImportMs = null;
  let bestSource = null;
  let worstSource = null;

  if (admin) {
    retryPending = await countTable("tkn_retry_queue", { status: "pending" });
    opsToday = await countTable("tkn_source_operations_log");
    try {
      const { data: ops } = await admin
        .from("tkn_source_operations_log")
        .select("duration_ms")
        .gte("created_at", todayIso)
        .not("duration_ms", "is", null)
        .limit(100);
      if (ops?.length) {
        avgImportMs = Math.round(ops.reduce((s, o) => s + (o.duration_ms || 0), 0) / ops.length);
      }
      const { data: sources } = await admin
        .from("akp_content_sources")
        .select("slug, name, success_rate, items_published")
        .order("success_rate", { ascending: false });
      if (sources?.length) {
        bestSource = sources[0];
        worstSource = sources.filter((s) => s.success_rate < 100).sort((a, b) => a.success_rate - b.success_rate)[0] || null;
      }
    } catch {
      /* optional tables */
    }
  }

  return {
    version: TKN_VERSION,
    pipelineStages: PIPELINE_STAGES,
    quotas: settings.dailyQuotas,
    weeklyQuotas: settings.weeklyQuotas,
    autoPublish: settings.autoPublish,
    today: {
      imported: akpDashboard.counts?.today?.items ?? 0,
      published: akpDashboard.counts?.published ?? 0,
      rejected: akpDashboard.counts?.rejected ?? 0,
    },
    sources: {
      total: akpDashboard.counts?.sources ?? 0,
      best: bestSource,
      worst: worstSource,
    },
    pipelines: akpDashboard.pipelines,
    queue: {
      mke: queueStats,
      retry: retryPending,
      review: akpDashboard.counts?.reviewPending ?? 0,
      dlq: akpDashboard.counts?.dlq ?? 0,
    },
    cron: akpDashboard.cronSchedules,
    performance: {
      avgImportMs,
    },
    lastRun: akpDashboard.lastRun,
    lastError: akpDashboard.lastError,
    health: akpDashboard.health,
    readinessPct: akpDashboard.readinessPct,
  };
}

export async function runHealthCheck() {
  const dashboard = await getTknDashboard();
  const ok = dashboard.health?.database === "connected";
  return {
    ok,
    version: TKN_VERSION,
    database: dashboard.health?.database || "unknown",
    mke: dashboard.health?.mke || "unknown",
    automation: dashboard.health?.automation || "unknown",
    queueSize: (dashboard.queue?.mke?.pending || 0) + (dashboard.queue?.retry || 0),
    reviewQueue: dashboard.queue?.review || 0,
    dlq: dashboard.queue?.dlq || 0,
  };
}
