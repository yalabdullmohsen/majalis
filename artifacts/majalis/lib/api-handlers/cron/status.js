/**
 * GET/POST /api/cron/status — authenticated queue/cron status (no secrets).
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { listAllowedJobTypes } from "../../../lib/jobs/queue.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "unauthorized" });
    return;
  }

  const out = {
    ok: true,
    at: new Date().toISOString(),
    commit:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GIT_COMMIT ||
      "unknown",
    allowedJobTypes: listAllowedJobTypes(),
    queue: {
      depth: null,
      running: null,
      deadLetters: null,
      durable: null,
    },
  };

  try {
    const { getPgPool } = await import("../../../lib/database.mjs");
    const pool = typeof getPgPool === "function" ? await getPgPool() : null;
    if (pool) {
      const { rows } = await pool.query(
        `SELECT
           (SELECT count(*)::int FROM public.background_jobs WHERE status IN ('queued','retry')) AS queued,
           (SELECT count(*)::int FROM public.background_jobs WHERE status = 'running') AS running,
           (SELECT count(*)::int FROM public.background_job_dead_letters) AS dead_letters`,
      );
      out.queue.depth = rows[0]?.queued ?? null;
      out.queue.running = rows[0]?.running ?? null;
      out.queue.deadLetters = rows[0]?.dead_letters ?? null;
      out.queue.durable = true;
    } else {
      out.queue.durable = false;
    }
  } catch (err) {
    out.queue.durable = false;
    out.queue.error = String(err?.message || err).slice(0, 120);
  }

  sendJson(res, 200, out);
}
