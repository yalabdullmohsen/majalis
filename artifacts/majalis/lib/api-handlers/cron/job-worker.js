/**
 * GET/POST /api/cron/job-worker
 * Claims and processes one background job under a short deadline.
 * Propagates AbortSignal to runners; aborts on deadline so AI/DB work stops.
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { claimNextJob, checkpointJob, completeJob, failJob } from "../../../lib/jobs/queue.mjs";
import { getJobWorker } from "../../../lib/jobs/job-workers.mjs";
import { randomUUID } from "node:crypto";

const WORKER_DEADLINE_MS = 8_000;

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const workerId = `worker-${randomUUID().slice(0, 8)}`;
  const deadline = Date.now() + WORKER_DEADLINE_MS;

  let job;
  try {
    job = await claimNextJob({ workerId, leaseMs: 40_000 });
  } catch (err) {
    if (err?.code === "durable_store_unavailable") {
      sendJson(res, 503, { ok: false, error: "durable_store_unavailable", claimed: false });
      return;
    }
    throw err;
  }

  if (!job) {
    sendJson(res, 200, { ok: true, claimed: false });
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
  }, Math.max(1, deadline - Date.now()));

  try {
    const signal = localAbort.signal;
    let cursor = job.cursor || {};
    let done = false;
    while (!done && Date.now() < deadline && !signal.aborted) {
      const batch = await run({ signal, cursor, metadata: job.metadata || {} });
      cursor = batch?.cursor || cursor;
      await checkpointJob(job.job_id, cursor);
      done = Boolean(batch?.done);
      if (!batch?.continue) break;
    }

    if (signal.aborted && !done) {
      await failJob(job.job_id, {
        errorCode: "aborted",
        errorMessage: String(signal.reason?.message || signal.reason || "aborted"),
        forceDeadLetter: false,
        attemptId,
      });
      sendJson(res, 200, { ok: false, jobId: job.job_id, status: "aborted", error: "aborted" });
      return;
    }

    if (done) {
      await completeJob(job.job_id, { cursor }, attemptId);
      sendJson(res, 200, { ok: true, jobId: job.job_id, status: "succeeded" });
      return;
    }

    await checkpointJob(job.job_id, cursor);
    sendJson(res, 200, { ok: true, jobId: job.job_id, status: "checkpointed", cursor });
  } catch (err) {
    const code = err?.code || (err?.name === "AbortError" ? "aborted" : "worker_error");
    await failJob(job.job_id, {
      errorCode: code,
      errorMessage: String(err?.message || err),
      forceDeadLetter: code === "no_worker_registered",
      attemptId,
    });
    if (!res.headersSent) {
      sendJson(res, 200, { ok: false, jobId: job.job_id, error: code });
    }
  } finally {
    clearTimeout(deadlineTimer);
    if (parent) parent.removeEventListener("abort", onParentAbort);
  }
}
