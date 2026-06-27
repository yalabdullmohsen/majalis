/**
 * Background import worker — triggers async processing on Vercel or via internal fetch.
 */

import { processImportJob } from "./engine.mjs";

const WORKER_SECRET = process.env.IMPORT_WORKER_SECRET || process.env.CRON_SECRET || "";

/**
 * Schedule import processing after HTTP response (Vercel waitUntil).
 * @param {import('http').ServerResponse} res
 * @param {string} jobId
 * @param {object} [opts]
 */
export function scheduleImportProcessing(res, jobId, opts = {}) {
  const work = processImportJob(jobId, opts).catch((err) => {
    console.error(`[content-import:worker] job ${jobId} failed`, err);
  });

  if (res && typeof res.waitUntil === "function") {
    res.waitUntil(work);
    return { mode: "waitUntil" };
  }

  if (typeof globalThis.waitUntil === "function") {
    globalThis.waitUntil(work);
    return { mode: "globalWaitUntil" };
  }

  void work;
  return { mode: "detached" };
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

  try {
    const res = await fetch(`${host}/api/admin/content-import`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "process", jobId }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[content-import:worker] trigger returned ${res.status}: ${text.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn("[content-import:worker] trigger fetch failed", err?.message || err);
  }
}

export { WORKER_SECRET };
