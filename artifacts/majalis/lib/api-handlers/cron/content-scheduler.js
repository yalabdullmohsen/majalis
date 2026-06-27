import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { runSchedulerJob, JOB_HANDLERS } from "../../../lib/content-production/scheduler.mjs";

/** Determine which jobs are due based on UTC time (matches vercel cron triggers). */
function getDueJobs(now = new Date()) {
  const hour = now.getUTCHours();
  const day = now.getUTCDay();
  const date = now.getUTCDate();
  const due = ["source-check"];

  if (hour % 2 === 0) due.push("content-update");
  if (hour % 6 === 0) due.push("reindex");
  if (hour === 4) due.push("daily-production");
  if (day === 0 && hour === 5) due.push("quality-review");
  if (date === 1 && hour === 6) due.push("cleanup");

  return [...new Set(due)];
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const admin = getSupabaseAdmin();
  const explicitJob = req.query?.job || req.body?.job;

  if (explicitJob) {
    if (!JOB_HANDLERS[explicitJob]) {
      sendJson(res, 400, { ok: false, error: `Unknown job: ${explicitJob}`, available: Object.keys(JOB_HANDLERS) });
      return;
    }
    try {
      const result = await runSchedulerJob(explicitJob, admin);
      sendJson(res, result.ok ? 200 : 500, result);
    } catch (error) {
      sendJson(res, 500, { ok: false, job: explicitJob, error: error.message });
    }
    return;
  }

  const due = getDueJobs();
  const results = [];

  for (const jobId of due) {
    try {
      const result = await runSchedulerJob(jobId, admin);
      results.push(result);
    } catch (error) {
      results.push({ ok: false, job: jobId, error: error.message });
    }
  }

  const allOk = results.every((r) => r.ok !== false);
  sendJson(res, allOk ? 200 : 207, { ok: allOk, due, results });
}
