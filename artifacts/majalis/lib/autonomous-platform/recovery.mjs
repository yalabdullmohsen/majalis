/**
 * Self-recovery — stuck runs, retry queue, DLQ escalation.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { QUEUE_DEFAULTS } from "./config.mjs";
import { logStructured, moveToDeadLetter } from "./monitoring.mjs";

export const MAX_RUN_MS = 30 * 60 * 1000; // 30 minutes
export const STUCK_RUN_STATUSES = ["running"];

export async function recoverStuckRuns() {
  const admin = getSupabaseAdmin();
  if (!admin) return { recovered: 0, restarted: 0 };

  const cutoff = new Date(Date.now() - MAX_RUN_MS).toISOString();
  let recovered = 0;
  let restarted = 0;

  try {
    const { data: stuck } = await admin
      .from("akp_pipeline_runs")
      .select("*")
      .eq("status", "running")
      .lt("started_at", cutoff);

    for (const run of stuck || []) {
      const retryCount = (run.retry_count || 0) + 1;
      await admin.from("akp_pipeline_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        metadata: { ...(run.metadata || {}), timeout: true, closed_at: new Date().toISOString() },
        errors: (run.errors || 0) + 1,
      }).eq("id", run.id);

      recovered += 1;

      await logStructured({
        level: "warn",
        component: "recovery",
        event: "run_timeout",
        pipeline: run.pipeline,
        runId: run.id,
        metadata: { retryCount },
      });

      if (retryCount <= 1) {
        await enqueueRetry({
          jobType: `pipeline_${run.pipeline}`,
          payload: { pipeline: run.pipeline, mode: run.mode, originalRunId: run.id },
          error: "run_timeout",
          retryCount: 0,
          pipelineRunId: run.id,
        });
        restarted += 1;
      } else {
        await moveToDeadLetter({
          queueName: "akp-pipeline",
          jobType: `pipeline_${run.pipeline}`,
          payload: { pipeline: run.pipeline, runId: run.id },
          error: "run_timeout_exceeded_retries",
          retryCount,
          originalJobId: run.id,
          failureReason: "timeout",
        });
      }

      await admin.from("akp_pipeline_runs").update({ retry_count: retryCount }).eq("id", run.id);
    }
  } catch (err) {
    await logStructured({
      level: "error",
      component: "recovery",
      event: "recover_stuck_failed",
      message: String(err.message || err),
    });
  }

  return { recovered, restarted };
}

export async function enqueueRetry({ queueName, jobType, payload, error, retryCount = 0, pipelineRunId, maxRetries }) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false };

  const max = maxRetries ?? QUEUE_DEFAULTS.maxRetries;
  const delay = QUEUE_DEFAULTS.retryDelayMs * Math.pow(2, retryCount);
  const nextRetryAt = new Date(Date.now() + delay).toISOString();

  try {
    const { data, error: insertErr } = await admin.from("akp_retry_queue").insert({
      queue_name: queueName || "akp-pipeline",
      job_type: jobType,
      payload: payload || {},
      error: String(error || ""),
      retry_count: retryCount,
      max_retries: max,
      next_retry_at: nextRetryAt,
      pipeline_run_id: pipelineRunId || null,
    }).select("id").single();
    if (insertErr) throw insertErr;
    return { ok: true, id: data.id };
  } catch {
    return { ok: false };
  }
}

export async function processRetryQueue(opts = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { processed: 0, succeeded: 0, failed: 0 };

  const batchSize = opts.batchSize || QUEUE_DEFAULTS.batchSize;
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    const { data: jobs } = await admin
      .from("akp_retry_queue")
      .select("*")
      .lte("next_retry_at", new Date().toISOString())
      .order("next_retry_at", { ascending: true })
      .limit(batchSize);

    const { runContentPipeline } = await import("./pipelines/index.mjs");

    for (const job of jobs || []) {
      if (job.retry_count >= job.max_retries) continue;
      processed += 1;

      try {
        const pipeline = job.payload?.pipeline || job.job_type?.replace("pipeline_", "");
        if (pipeline) {
          const result = await runContentPipeline(pipeline, {
            triggerType: "retry",
            maxItems: 5,
            _retryJobId: job.id,
          });
          if (result.ok) {
            succeeded += 1;
            await admin.from("akp_retry_queue").delete().eq("id", job.id);
          } else {
            throw new Error(result.error || "pipeline_failed");
          }
        } else {
          await admin.from("akp_retry_queue").delete().eq("id", job.id);
          succeeded += 1;
        }
      } catch (err) {
        const nextRetry = job.retry_count + 1;
        if (nextRetry >= job.max_retries) {
          failed += 1;
          await moveToDeadLetter({
            queueName: job.queue_name,
            jobType: job.job_type,
            payload: job.payload,
            error: String(err.message || err),
            retryCount: nextRetry,
            originalJobId: job.id,
          });
          await admin.from("akp_retry_queue").delete().eq("id", job.id);
        } else {
          const delay = QUEUE_DEFAULTS.retryDelayMs * Math.pow(2, nextRetry);
          await admin.from("akp_retry_queue").update({
            retry_count: nextRetry,
            error: String(err.message || err),
            next_retry_at: new Date(Date.now() + delay).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("id", job.id);
        }
      }
    }
  } catch (err) {
    await logStructured({
      level: "error",
      component: "recovery",
      event: "retry_queue_failed",
      message: String(err.message || err),
    });
  }

  return { processed, succeeded, failed };
}

export async function getRetryQueueStats() {
  const admin = getSupabaseAdmin();
  if (!admin) return { pending: 0, total: 0 };
  try {
    const { count: pending } = await admin
      .from("akp_retry_queue")
      .select("id", { count: "exact", head: true })
      .lte("next_retry_at", new Date().toISOString());
    const { count: total } = await admin
      .from("akp_retry_queue")
      .select("id", { count: "exact", head: true });
    return { pending: pending || 0, total: total || 0 };
  } catch {
    return { pending: 0, total: 0 };
  }
}
