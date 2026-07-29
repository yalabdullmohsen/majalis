/**
 * Cron HTTP entry — auth + enqueue + 202. Long work runs via /api/cron/job-worker.
 */
import { sendJson } from "../api/_http.mjs";
import { validateCronAuth } from "../../lib/env-config.mjs";
import { enqueueJob, isAllowedJobType } from "../../lib/jobs/queue.mjs";

function dayBucket() {
  return new Date().toISOString().slice(0, 13); // hourly idempotency window
}

/**
 * @param {string} jobType
 */
export function createEnqueueCronHandler(jobType) {
  return async function handler(req, res) {
    if (!validateCronAuth(req)) {
      sendJson(res, 401, { ok: false, error: "Unauthorized" });
      return;
    }
    if (!isAllowedJobType(jobType)) {
      sendJson(res, 400, { ok: false, error: "invalid_job_type" });
      return;
    }

    const bodyType = req.body?.job_type || req.query?.job_type;
    if (bodyType && bodyType !== jobType) {
      sendJson(res, 400, { ok: false, error: "job_type_mismatch" });
      return;
    }

    const idempotencyKey =
      String(req.body?.idempotency_key || req.headers?.["idempotency-key"] || `${jobType}:${dayBucket()}`);

    const result = await enqueueJob({
      jobType,
      idempotencyKey,
      metadata: {
        triggeredBy: "cron",
        path: req.url || null,
        requestId: req.requestId || null,
      },
    });

    if (!result.ok) {
      const status =
        result.error === "durable_store_unavailable" ? 503 : 400;
      sendJson(res, status, {
        ok: false,
        error: result.error,
        durable: result.durable === true,
      });
      return;
    }

    sendJson(res, 202, {
      ok: true,
      status: "accepted",
      jobId: result.job.job_id,
      jobType: result.job.job_type,
      jobStatus: result.job.status,
      durable: result.durable,
    });
  };
}
