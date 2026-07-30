/**
 * Cron HTTP entry — auth + enqueue + 202. Long work runs via /api/cron/job-worker.
 * Rejects enqueue when no worker is registered (no fake 202 success).
 */
import { sendJson } from "../api/_http.mjs";
import { validateCronAuth } from "../../lib/env-config.mjs";
import { enqueueJob, isAllowedJobType } from "../../lib/jobs/queue.mjs";
import { hasJobWorker } from "../../lib/jobs/job-workers.mjs";

function dayBucket() {
  return new Date().toISOString().slice(0, 13); // hourly idempotency window
}

const AKP_PATH_MODE = {
  "autonomous-platform-fetch": "fetch",
  "autonomous-platform-validate": "validate",
  "autonomous-platform-questions": "questions",
  "autonomous-platform-benefits": "benefits",
  "autonomous-platform-reindex": "reindex",
  "autonomous-platform-audit": "audit",
  "autonomous-platform-cleanup": "cleanup",
  "autonomous-platform-bootstrap": "bootstrap",
  "autonomous-platform-monitor": "monitor",
  "autonomous-platform-recovery": "recovery",
};

/**
 * Resolve mode / job metadata from request path, query, and body.
 * @param {import('http').IncomingMessage & { url?: string, path?: string, query?: any, body?: any }} req
 * @param {string} jobType
 * @param {Record<string, unknown>} [extra]
 */
export function resolveEnqueueMetadata(req, jobType, extra = {}) {
  const url = String(req.url || req.path || "");
  const pathTail = url.split("?")[0].split("/").filter(Boolean).pop() || "";

  let mode =
    req.body?.mode ||
    req.query?.mode ||
    extra.mode ||
    null;

  if (!mode && jobType === "autonomous-platform") {
    mode = AKP_PATH_MODE[pathTail] || null;
  }
  if (!mode && jobType === "autonomous-platform-recovery") {
    mode = "recovery";
  }
  if (!mode && jobType === "majlis-knowledge-engine") {
    mode = "full";
  }
  if (!mode && jobType === "governance-backup") {
    mode = "backup";
  }

  const job =
    req.body?.job ||
    req.query?.job ||
    extra.job ||
    (jobType === "content-scheduler" ? "source-check" : null);

  const metadata = {
    triggeredBy: "cron",
    path: req.url || null,
    requestId: req.requestId || null,
    ...extra,
  };
  if (mode) metadata.mode = String(mode);
  if (job) metadata.job = String(job);

  for (const key of ["dryRun", "sourceId", "maxItems", "skipPublish", "batchSize", "checkLinks", "skipDiscovery"]) {
    const v = req.body?.[key] ?? req.query?.[key];
    if (v !== undefined && v !== null && v !== "") metadata[key] = v;
  }

  return metadata;
}

/**
 * @param {string} jobType
 * @param {{
 *   resolveMetadata?: (req: any) => Record<string, unknown>,
 *   resolveIdempotencyKey?: (req: any, jobType: string, metadata: Record<string, unknown>) => string,
 * }} [options]
 */
export function createEnqueueCronHandler(jobType, options = {}) {
  return async function handler(req, res) {
    if (!validateCronAuth(req)) {
      sendJson(res, 401, { ok: false, error: "Unauthorized" });
      return;
    }
    if (!isAllowedJobType(jobType)) {
      sendJson(res, 400, { ok: false, error: "invalid_job_type" });
      return;
    }
    if (!hasJobWorker(jobType)) {
      sendJson(res, 503, {
        ok: false,
        error: "no_worker_registered",
        jobType,
        accepted: false,
      });
      return;
    }

    const bodyType = req.body?.job_type || req.query?.job_type;
    if (bodyType && bodyType !== jobType) {
      sendJson(res, 400, { ok: false, error: "job_type_mismatch" });
      return;
    }

    const extra = typeof options.resolveMetadata === "function" ? options.resolveMetadata(req) || {} : {};
    const metadata = resolveEnqueueMetadata(req, jobType, extra);

    const defaultKeyParts = [jobType];
    if (metadata.mode) defaultKeyParts.push(String(metadata.mode));
    if (metadata.job) defaultKeyParts.push(String(metadata.job));
    defaultKeyParts.push(dayBucket());

    const idempotencyKey = String(
      req.body?.idempotency_key ||
        req.headers?.["idempotency-key"] ||
        (typeof options.resolveIdempotencyKey === "function"
          ? options.resolveIdempotencyKey(req, jobType, metadata)
          : defaultKeyParts.join(":")),
    );

    const result = await enqueueJob({
      jobType,
      idempotencyKey,
      metadata,
    });

    if (!result.ok) {
      const status = result.error === "durable_store_unavailable" ? 503 : 400;
      sendJson(res, status, {
        ok: false,
        error: result.error,
        durable: result.durable === true,
        accepted: false,
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
      mode: metadata.mode || null,
      job: metadata.job || null,
      duplicate: result.duplicate === true,
    });
  };
}
