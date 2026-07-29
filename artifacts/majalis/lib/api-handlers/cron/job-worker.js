/**
 * GET/POST /api/cron/job-worker
 * Claims and processes one background job batch under a short deadline.
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { claimNextJob, checkpointJob, completeJob, failJob } from "../../../lib/jobs/queue.mjs";
import { getJobWorker } from "../../../lib/jobs/job-workers.mjs";
import { randomUUID } from "node:crypto";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const workerId = `worker-${randomUUID().slice(0, 8)}`;
  const deadline = Date.now() + 8_000;
  const job = await claimNextJob({ workerId, leaseMs: 40_000 });
  if (!job) {
    sendJson(res, 200, { ok: true, claimed: false });
    return;
  }

  const run = getJobWorker(job.job_type);
  if (!run) {
    await failJob(job.job_id, {
      errorCode: "no_worker_registered",
      errorMessage: `No inline worker registered for job_type=${job.job_type}`,
      forceDeadLetter: true,
    });
    sendJson(res, 200, {
      ok: false,
      jobId: job.job_id,
      status: "dead_letter",
      error: "no_worker_registered",
    });
    return;
  }

  try {
    const signal = req.abortSignal;
    let cursor = job.cursor || {};
    let done = false;
    while (!done && Date.now() < deadline && !signal?.aborted) {
      const batch = await run({ signal, cursor, metadata: job.metadata });
      cursor = batch?.cursor || cursor;
      await checkpointJob(job.job_id, cursor);
      done = Boolean(batch?.done);
      if (!batch?.continue) break;
    }
    if (done) {
      await completeJob(job.job_id, { cursor });
      sendJson(res, 200, { ok: true, jobId: job.job_id, status: "succeeded" });
      return;
    }
    await checkpointJob(job.job_id, cursor);
    sendJson(res, 200, { ok: true, jobId: job.job_id, status: "checkpointed", cursor });
  } catch (err) {
    await failJob(job.job_id, {
      errorCode: err?.code || "worker_error",
      errorMessage: String(err?.message || err),
    });
    if (!res.headersSent) {
      sendJson(res, 200, { ok: false, jobId: job.job_id, error: "worker_error" });
    }
  }
}
