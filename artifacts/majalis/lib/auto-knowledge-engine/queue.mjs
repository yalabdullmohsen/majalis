/**
 * Job queue with retry support
 */

import { akeLog, auditLog } from "./monitoring.mjs";
import { adaptiveRetryDelay, classifyRetryError, RETRY_CLASS, shouldRequeueJob } from "./hardening/adaptive-retry.mjs";

/** Legacy schedule kept for backward compatibility */
export const RETRY_SCHEDULE_MS = [0, 60_000, 300_000, 900_000];

export function nextRetryDelay(attempt, error = null) {
  if (error) {
    const { class: errorClass } = classifyRetryError(error);
    const delay = adaptiveRetryDelay(attempt, errorClass);
    return delay ?? RETRY_SCHEDULE_MS[Math.min(attempt - 1, RETRY_SCHEDULE_MS.length - 1)];
  }
  return RETRY_SCHEDULE_MS[Math.min(attempt - 1, RETRY_SCHEDULE_MS.length - 1)];
}

export async function enqueueJob(admin, { connectorId, jobType, payload, priority = 5, maxAttempts = 4, attempt = 1 }) {
  if (!admin) return null;
  try {
    const { data, error } = await admin
      .from("ake_job_queue")
      .insert({
        connector_id: connectorId || null,
        job_type: jobType,
        payload: payload || {},
        priority,
        max_attempts: maxAttempts,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    akeLog("queue", { error: err.message, jobType }, "error");
    return null;
  }
}

export async function processNextJobs(admin, handler, limit = 5) {
  if (!admin) return [];

  const { data: jobs } = await admin
    .from("ake_job_queue")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("priority", { ascending: true })
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  const results = [];
  for (const job of jobs || []) {
    await admin.from("ake_job_queue").update({
      status: "running",
      started_at: new Date().toISOString(),
      attempts: job.attempts + 1,
    }).eq("id", job.id);

    try {
      const result = await handler(job);
      await admin.from("ake_job_queue").update({
        status: "completed",
        finished_at: new Date().toISOString(),
        result: result || {},
      }).eq("id", job.id);
      results.push({ id: job.id, ok: true, result });
    } catch (err) {
      const attempts = job.attempts + 1;
      const canRetry = shouldRequeueJob(err, attempts, job.max_attempts);
      const failed = !canRetry;
      const retryDelay = nextRetryDelay(attempts, err);
      const { class: errorClass } = classifyRetryError(err);
      if (errorClass === RETRY_CLASS.NEVER) {
        await admin.from("ake_job_queue").update({
          status: "failed",
          attempts,
          last_error: err.message,
          finished_at: new Date().toISOString(),
        }).eq("id", job.id);
      } else {
        await admin.from("ake_job_queue").update({
          status: failed ? "failed" : "pending",
          attempts,
          last_error: err.message,
          finished_at: failed ? new Date().toISOString() : null,
          scheduled_at: failed
            ? job.scheduled_at
            : new Date(Date.now() + (retryDelay ?? 60_000)).toISOString(),
        }).eq("id", job.id);
      }

      await auditLog(admin, {
        action: "job_retry",
        status: failed ? "error" : "warn",
        message: err.message,
        details: { jobId: job.id, attempts },
      });
      results.push({ id: job.id, ok: false, error: err.message });
    }
  }
  return results;
}

export async function withRetry(fn, { maxAttempts = 3, delayMs = 1000, label = "operation" } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      akeLog("retry", { label, attempt, error: err.message }, "warn");
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastError;
}
