/**
 * Job queue worker — retries failed tasks, drains retry queue.
 */

import { logPipelineEvent } from "./audit.mjs";
import { PERFORMANCE } from "./config.mjs";
import { runIngestPipelines } from "./stages.mjs";

export async function enqueueRetry(admin, { jobType, payload, error }) {
  if (!admin) return { ok: false };

  const row = {
    job_type: jobType,
    payload,
    last_error: error ? String(error).slice(0, 500) : null,
    status: "pending",
    next_retry_at: new Date(Date.now() + PERFORMANCE.retryBackoffMs[0]).toISOString(),
  };

  try {
    await admin.from("autonomous_retry_queue").insert(row);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function processRetryQueue(admin, runId) {
  if (!admin) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  try {
    const { data: jobs } = await admin
      .from("autonomous_retry_queue")
      .select("*")
      .eq("status", "pending")
      .lte("next_retry_at", new Date().toISOString())
      .limit(5);

    for (const job of jobs || []) {
      try {
        if (job.job_type === "ingest") {
          await runIngestPipelines(admin, runId, job.payload || {});
        }

        await admin
          .from("autonomous_retry_queue")
          .update({ status: "completed", attempts: job.attempts + 1 })
          .eq("id", job.id);

        processed++;
      } catch (error) {
        const attempts = (job.attempts || 0) + 1;
        const maxAttempts = job.max_attempts || 3;
        const backoff = PERFORMANCE.retryBackoffMs[Math.min(attempts - 1, PERFORMANCE.retryBackoffMs.length - 1)];

        await admin
          .from("autonomous_retry_queue")
          .update({
            status: attempts >= maxAttempts ? "failed" : "pending",
            attempts,
            last_error: error.message,
            next_retry_at: new Date(Date.now() + backoff).toISOString(),
          })
          .eq("id", job.id);

        failed++;

        await enqueueRetry(admin, {
          jobType: job.job_type,
          payload: job.payload,
          error: error.message,
        }).catch(() => {});
      }
    }

    await logPipelineEvent(admin, {
      runId,
      stage: "audit",
      eventType: "retry_queue_processed",
      message: `Retry queue: ${processed} completed, ${failed} failed`,
      metadata: { processed, failed },
    });
  } catch {
    /* queue table may not exist */
  }

  return { processed, failed };
}

export async function processAkeJobQueue(admin) {
  if (!admin) return { processed: 0 };

  let processed = 0;

  try {
    const { data: jobs } = await admin
      .from("ake_job_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at")
      .limit(10);

    for (const job of jobs || []) {
      await admin.from("ake_job_queue").update({ status: "running" }).eq("id", job.id);

      try {
        await admin.from("ake_job_queue").update({ status: "completed", finished_at: new Date().toISOString() }).eq("id", job.id);
        processed++;
      } catch (error) {
        await admin
          .from("ake_job_queue")
          .update({ status: "failed", error_message: error.message })
          .eq("id", job.id);
      }
    }
  } catch {
    /* inline processing mode */
  }

  return { processed };
}
