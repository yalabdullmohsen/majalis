/**
 * GET/POST /api/cron/job-worker
 * Claims at most one job and runs ≤1 batch under a hard time budget.
 * Must return before dispatch CRON_HANDLER_TIMEOUT_MS (12s) → never 504.
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { claimNextJob, checkpointJob, completeJob, failJob } from "../../../lib/jobs/queue.mjs";
import { getJobWorker } from "../../../lib/jobs/job-workers.mjs";
import { randomUUID } from "node:crypto";

/** Soft work budget — leave headroom under dispatch 12s timeout. */
export const WORKER_DEADLINE_MS = 6_000;
/** Claim lease aligned with a single tick (not 40s). */
export const WORKER_LEASE_MS = 15_000;
/** One batch per HTTP invoke — long jobs continue via cursor + next cron tick. */
export const MAX_BATCHES_PER_INVOKE = 1;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {object} opts
 * @param {() => Promise<any>} opts.run
 * @param {number} opts.deadlineAt
 * @param {AbortSignal} opts.signal
 * @param {object} opts.cursor
 * @param {object} opts.metadata
 * @param {number} [opts.maxBatches]
 */
export async function runJobBatchesWithBudget({
  run,
  deadlineAt,
  signal,
  cursor,
  metadata,
  maxBatches = MAX_BATCHES_PER_INVOKE,
}) {
  let nextCursor = cursor || {};
  let done = false;
  let batches = 0;
  let timedOut = false;

  while (!done && batches < maxBatches && Date.now() < deadlineAt && !signal.aborted) {
    batches += 1;
    const remaining = Math.max(1, deadlineAt - Date.now());
    const work = Promise.resolve().then(() => run({ signal, cursor: nextCursor, metadata }));
    const raced = await Promise.race([
      work.then((batch) => ({ kind: "batch", batch })),
      sleep(remaining).then(() => ({ kind: "timeout" })),
    ]);

    if (raced.kind === "timeout") {
      timedOut = true;
      // Detach hanging work — do not await past budget.
      void work.catch(() => undefined);
      break;
    }

    const batch = raced.batch;
    nextCursor = batch?.cursor || nextCursor;
    done = Boolean(batch?.done);
    if (!batch?.continue) break;
  }

  return { cursor: nextCursor, done, batches, timedOut, aborted: Boolean(signal.aborted) };
}

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const started = Date.now();
  const deadlineAt = started + WORKER_DEADLINE_MS;
  const workerId = `worker-${randomUUID().slice(0, 8)}`;

  let job;
  try {
    job = await claimNextJob({ workerId, leaseMs: WORKER_LEASE_MS });
  } catch (err) {
    if (err?.code === "durable_store_unavailable") {
      sendJson(res, 503, {
        ok: false,
        error: "durable_store_unavailable",
        reason: err?.reason || null,
        claimed: false,
      });
      return;
    }
    throw err;
  }

  if (!job) {
    sendJson(res, 200, { ok: true, claimed: false, elapsedMs: Date.now() - started });
    return;
  }

  const attemptId = job._attempt_id || null;
  const run = getJobWorker(job.job_type);
  if (!run) {
    await failJob(job.job_id, {
      errorCode: "no_worker_registered",
      errorMessage: `No inline worker registered for job_type=${job.job_type}`,
      forceDeadLetter: true,
      attemptId,
    });
    sendJson(res, 200, {
      ok: false,
      jobId: job.job_id,
      status: "dead_letter",
      error: "no_worker_registered",
      elapsedMs: Date.now() - started,
    });
    return;
  }

  const localAbort = new AbortController();
  const parent = req.abortSignal;
  const onParentAbort = () => {
    try {
      localAbort.abort(parent?.reason || new Error("request_aborted"));
    } catch {
      /* ignore */
    }
  };
  if (parent) {
    if (parent.aborted) onParentAbort();
    else parent.addEventListener("abort", onParentAbort, { once: true });
  }

  const deadlineTimer = setTimeout(() => {
    try {
      localAbort.abort(new Error("worker_deadline"));
    } catch {
      /* ignore */
    }
  }, Math.max(1, deadlineAt - Date.now()));

  try {
    const signal = localAbort.signal;
    const result = await runJobBatchesWithBudget({
      run,
      deadlineAt,
      signal,
      cursor: job.cursor || {},
      metadata: job.metadata || {},
      maxBatches: MAX_BATCHES_PER_INVOKE,
    });

    if (result.timedOut || (result.aborted && !result.done)) {
      // Soft stop: extend lease + keep running. Next claim recovers via expired lease
      // without burning attempt_count or dead-lettering.
      await checkpointJob(job.job_id, result.cursor, { leaseMs: WORKER_LEASE_MS });
      sendJson(res, 200, {
        ok: true,
        jobId: job.job_id,
        status: "checkpointed",
        reason: result.timedOut ? "worker_deadline" : "aborted",
        cursor: result.cursor,
        batches: result.batches,
        elapsedMs: Date.now() - started,
      });
      return;
    }

    if (result.done) {
      await completeJob(job.job_id, { cursor: result.cursor }, attemptId);
      sendJson(res, 200, {
        ok: true,
        jobId: job.job_id,
        status: "succeeded",
        batches: result.batches,
        elapsedMs: Date.now() - started,
      });
      return;
    }

    await checkpointJob(job.job_id, result.cursor, { leaseMs: WORKER_LEASE_MS });
    sendJson(res, 200, {
      ok: true,
      jobId: job.job_id,
      status: "checkpointed",
      cursor: result.cursor,
      batches: result.batches,
      elapsedMs: Date.now() - started,
    });
  } catch (err) {
    const code = err?.code || (err?.name === "AbortError" ? "aborted" : "worker_error");
    if (code === "aborted") {
      await checkpointJob(job.job_id, job.cursor || {}, { leaseMs: WORKER_LEASE_MS });
      if (!res.headersSent) {
        sendJson(res, 200, {
          ok: true,
          jobId: job.job_id,
          status: "checkpointed",
          reason: "aborted",
          elapsedMs: Date.now() - started,
        });
      }
      return;
    }
    await failJob(job.job_id, {
      errorCode: code,
      errorMessage: String(err?.message || err),
      forceDeadLetter: code === "no_worker_registered",
      attemptId,
    });
    if (!res.headersSent) {
      sendJson(res, 200, {
        ok: false,
        jobId: job.job_id,
        error: code,
        elapsedMs: Date.now() - started,
      });
    }
  } finally {
    clearTimeout(deadlineTimer);
    if (parent) parent.removeEventListener("abort", onParentAbort);
  }
}
