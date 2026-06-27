/**
 * Background import worker — triggers async processing on Vercel or via internal fetch.
 */

import { processImportJob } from "./engine.mjs";
import { jobLog } from "./import-jobs.mjs";

const WORKER_SECRET = process.env.IMPORT_WORKER_SECRET || process.env.CRON_SECRET || "";

/** Rows at or below this count are processed synchronously in the commit handler. */
export const IMPORT_SYNC_ROW_THRESHOLD = Number(process.env.IMPORT_SYNC_ROW_THRESHOLD) || 5000;

/**
 * Schedule import processing after HTTP response (Vercel waitUntil).
 * @param {import('http').ServerResponse} res
 * @param {string} jobId
 * @param {object} [opts]
 */
export function scheduleImportProcessing(res, jobId, opts = {}) {
  const work = processImportJob(jobId, opts).catch((err) => {
    jobLog(jobId, "worker_process_failed", { error: String(err.message || err), stack: err?.stack });
    console.error(`[content-import:worker] job ${jobId} failed`, err);
  });

  if (res && typeof res.waitUntil === "function") {
    res.waitUntil(work);
    jobLog(jobId, "worker_scheduled", { mode: "waitUntil" });
    return { mode: "waitUntil", work };
  }

  if (typeof globalThis.waitUntil === "function") {
    globalThis.waitUntil(work);
    jobLog(jobId, "worker_scheduled", { mode: "globalWaitUntil" });
    return { mode: "globalWaitUntil", work };
  }

  void work;
  jobLog(jobId, "worker_scheduled", { mode: "detached" });
  return { mode: "detached", work };
}

/**
 * Fire-and-forget internal request to process endpoint (fallback when waitUntil unavailable).
 * @param {string} jobId
 * @param {string} [authHeader]
 */
export async function triggerImportWorkerFetch(jobId, authHeader = "") {
  const host =
    process.env.VERCEL_URL && !process.env.VERCEL_URL.includes("localhost")
      ? `https://${process.env.VERCEL_URL}`
      : `http://127.0.0.1:${process.env.PORT || 24216}`;

  const headers = {
    "Content-Type": "application/json",
    "x-import-worker": WORKER_SECRET || "internal",
  };
  if (authHeader) headers.Authorization = authHeader;

  jobLog(jobId, "worker_fetch_trigger", { host: host.replace(/\/\/.*@/, "//") });

  try {
    const res = await fetch(`${host}/api/admin/content-import`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "process", jobId }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      jobLog(jobId, "worker_fetch_failed", { status: res.status, body: text.slice(0, 200) });
      console.warn(`[content-import:worker] trigger returned ${res.status}: ${text.slice(0, 200)}`);
      return { ok: false, status: res.status };
    }
    jobLog(jobId, "worker_fetch_ok", { status: res.status });
    return { ok: true, status: res.status };
  } catch (err) {
    jobLog(jobId, "worker_fetch_error", { error: String(err?.message || err) });
    console.warn("[content-import:worker] trigger fetch failed", err?.message || err);
    return { ok: false, error: String(err?.message || err) };
  }
}

export { WORKER_SECRET };
