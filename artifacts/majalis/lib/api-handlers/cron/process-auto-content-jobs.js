import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { processQueuedAutoContentJobs } from "../../../lib/auto-content/auto-content-job-worker.mjs";
import { runAutoContentJobWatchdog } from "../../../lib/auto-content/auto-content-jobs.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const limit = Number(req.query?.limit || req.body?.limit) || 3;

  try {
    const watchdog = await runAutoContentJobWatchdog();
    const result = await processQueuedAutoContentJobs(limit);
    sendJson(res, 200, { ok: true, watchdog, ...result });
  } catch (error) {
    console.error("[cron/process-auto-content-jobs]", error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
