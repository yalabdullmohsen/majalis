/**
 * Monitoring — logs, retry queue, DLQ, health checks, alerts, metrics.
 */
import { MONITORING_CONFIG } from "./config.mjs";

export async function logEvent(admin, { runId, pipeline, stage, level = "info", message, metadata = {}, durationMs }) {
  if (!admin) {
    console.log(`[content-production][${level}] ${stage}: ${message}`);
    return null;
  }
  const { data, error } = await admin
    .from("content_production_logs")
    .insert({
      run_id: runId || null,
      pipeline: pipeline || null,
      stage,
      level,
      message,
      metadata,
      duration_ms: durationMs ?? null,
    })
    .select("id")
    .maybeSingle();
  if (error) console.error("[content-production] log failed", error.message);
  return data?.id;
}

export async function enqueueRetry(admin, { pipeline, jobId, payload, error }) {
  if (!admin) return null;
  const { data: existing } = await admin
    .from("content_production_retry_queue")
    .select("*")
    .eq("pipeline", pipeline)
    .eq("status", "pending")
    .contains("payload", { staging_id: payload.staging_id })
    .maybeSingle();

  const attempts = (existing?.attempts || 0) + 1;
  if (attempts > MONITORING_CONFIG.maxRetries) {
    return moveToDeadLetter(admin, { pipeline, jobId, payload, error, attempts });
  }

  const backoff = MONITORING_CONFIG.retryBackoffMs[Math.min(attempts - 1, 2)] || 900_000;
  const nextRetry = new Date(Date.now() + backoff).toISOString();

  const row = {
    pipeline,
    job_id: jobId,
    payload,
    attempts,
    last_error: error,
    next_retry_at: nextRetry,
    status: "pending",
  };

  if (existing?.id) {
    await admin.from("content_production_retry_queue").update(row).eq("id", existing.id);
    return existing.id;
  }

  const { data, error: insertErr } = await admin
    .from("content_production_retry_queue")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (insertErr) throw insertErr;
  return data?.id;
}

export async function moveToDeadLetter(admin, { pipeline, jobId, payload, error, attempts }) {
  if (!admin) return null;
  const { data, error: insertErr } = await admin
    .from("content_production_dead_letter")
    .insert({ pipeline, job_id: jobId, payload, error, attempts })
    .select("id")
    .maybeSingle();
  if (insertErr) throw insertErr;
  await createAlert(admin, {
    severity: "critical",
    title: `فشل نهائي — ${pipeline || jobId}`,
    message: error,
    pipeline,
  });
  return data?.id;
}

export async function processRetryQueue(admin, limit = 20) {
  if (!admin) return { processed: 0, succeeded: 0, failed: 0 };

  const now = new Date().toISOString();
  const { data: jobs } = await admin
    .from("content_production_retry_queue")
    .select("*")
    .eq("status", "pending")
    .lte("next_retry_at", now)
    .order("next_retry_at", { ascending: true })
    .limit(limit);

  let succeeded = 0;
  let failed = 0;

  for (const job of jobs || []) {
    await admin.from("content_production_retry_queue").update({ status: "running" }).eq("id", job.id);
    try {
      const { processStagingItem } = await import("./pipelines/base-pipeline.mjs");
      const result = await processStagingItem(admin, job.payload.staging_id, { runId: null });
      if (result.published) {
        await admin.from("content_production_retry_queue").update({ status: "completed" }).eq("id", job.id);
        succeeded += 1;
      } else {
        throw new Error(result.reason || "retry failed");
      }
    } catch (err) {
      failed += 1;
      await enqueueRetry(admin, {
        pipeline: job.pipeline,
        jobId: job.job_id,
        payload: job.payload,
        error: err.message,
      });
      await admin.from("content_production_retry_queue").update({ status: "failed" }).eq("id", job.id);
    }
  }

  return { processed: (jobs || []).length, succeeded, failed };
}

export async function recordHealthCheck(admin, checkName, status, details = {}) {
  if (!admin) return;
  await admin.from("content_production_health").insert({
    check_name: checkName,
    status,
    details,
  });
}

export async function createAlert(admin, { severity, title, message, pipeline }) {
  if (!admin) {
    console.warn(`[ALERT:${severity}] ${title} — ${message}`);
    return;
  }
  await admin.from("content_production_alerts").insert({
    severity,
    title,
    message,
    pipeline: pipeline || null,
  });
}

export async function getObservability(admin) {
  if (!admin) {
    return { logs: [], retries: [], dlq: [], health: [], alerts: [] };
  }

  const [logs, retries, dlq, health, alerts, runs] = await Promise.all([
    admin.from("content_production_logs").select("*").order("created_at", { ascending: false }).limit(50),
    admin
      .from("content_production_retry_queue")
      .select("*")
      .in("status", ["pending", "running"])
      .order("next_retry_at", { ascending: true })
      .limit(20),
    admin.from("content_production_dead_letter").select("*").order("created_at", { ascending: false }).limit(20),
    admin.from("content_production_health").select("*").order("checked_at", { ascending: false }).limit(10),
    admin
      .from("content_production_alerts")
      .select("*")
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("content_scheduler_runs").select("*").order("started_at", { ascending: false }).limit(10),
  ]);

  return {
    logs: logs.data || [],
    retries: retries.data || [],
    dlq: dlq.data || [],
    health: health.data || [],
    alerts: alerts.data || [],
    runs: runs.data || [],
  };
}

export async function cleanupOldLogs(admin, retentionDays = MONITORING_CONFIG.logRetentionDays) {
  if (!admin) return { deleted: 0 };
  const cutoff = new Date(Date.now() - retentionDays * 86400000).toISOString();
  const { count } = await admin
    .from("content_production_logs")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);
  return { deleted: count || 0 };
}

export async function cleanupDeadLetter(admin, retentionDays = MONITORING_CONFIG.dlqRetentionDays) {
  if (!admin) return { deleted: 0 };
  const cutoff = new Date(Date.now() - retentionDays * 86400000).toISOString();
  const { count } = await admin
    .from("content_production_dead_letter")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);
  return { deleted: count || 0 };
}
