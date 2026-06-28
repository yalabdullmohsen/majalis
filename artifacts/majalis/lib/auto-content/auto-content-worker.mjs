/**
 * Background auto-content worker — triggers async processing on Vercel or via detached promise.
 */

import { processAutoContentJob, processQueuedAutoContentJobs } from "./auto-content-job-worker.mjs";
import { jobLog } from "./auto-content-jobs.mjs";

const WORKER_SECRET = process.env.AUTO_CONTENT_WORKER_SECRET || process.env.CRON_SECRET || "";

/**
 * Schedule job processing after HTTP response (Vercel waitUntil).
 * @param {import('http').ServerResponse} [res]
 * @param {string} jobId
 */
export function scheduleAutoContentProcessing(res, jobId) {
  const work = processAutoContentJob(jobId).catch((err) => {
    jobLog(jobId, "worker_process_failed", { error: String(err.message || err) });
    console.error(`[auto-content:worker] job ${jobId} failed`, err);
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
 * Fire-and-forget internal request to process endpoint.
 * @param {string} jobId
 * @param {string} [authHeader]
 */
export async function triggerAutoContentWorkerFetch(jobId, authHeader = "") {
  const host =
    process.env.VERCEL_URL && !process.env.VERCEL_URL.includes("localhost")
      ? `https://${process.env.VERCEL_URL}`
      : `http://127.0.0.1:${process.env.PORT || 24216}`;

  const headers = {
    "Content-Type": "application/json",
    "x-auto-content-worker": WORKER_SECRET || "internal",
  };
  if (authHeader) headers.Authorization = authHeader;

  jobLog(jobId, "worker_fetch_trigger", { host: host.replace(/\/\/.*@/, "//") });

  try {
    const res = await fetch(`${host}/api/admin/auto-content?action=process&jobId=${encodeURIComponent(jobId)}`, {
      method: "POST",
      headers,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      jobLog(jobId, "worker_fetch_failed", { status: res.status, body: text.slice(0, 200) });
      return { ok: false, status: res.status };
    }
    jobLog(jobId, "worker_fetch_ok", { status: res.status });
    return { ok: true, status: res.status };
  } catch (err) {
    jobLog(jobId, "worker_fetch_error", { error: String(err?.message || err) });
    return { ok: false, error: String(err?.message || err) };
  }
}

export { WORKER_SECRET };
