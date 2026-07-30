/**
 * GET/POST /api/readyz — readiness (real store checks, no DDL).
 * Public body stays minimal; details go to logs only.
 */
import { sendJson } from "../api/_http.mjs";

export default async function handler(req, res) {
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT ||
    process.env.npm_package_version ||
    "unknown";

  let ready = true;
  const details = {
    schema: null,
    queue: null,
    circuit: null,
    attempts: null,
    deadLetters: null,
    pingMs: null,
  };

  try {
    const { getPgPool } = await import("../database.mjs");
    const pool = typeof getPgPool === "function" ? await getPgPool() : null;
    if (!pool) {
      ready = false;
      details.schema = "no_pool";
    } else {
      const t0 = Date.now();
      const { rows } = await pool.query(
        `SELECT
           to_regclass('public.background_jobs') IS NOT NULL AS has_jobs,
           to_regclass('public.ai_provider_circuit') IS NOT NULL AS has_circuit,
           to_regclass('public.background_job_attempts') IS NOT NULL AS has_attempts,
           to_regclass('public.background_job_dead_letters') IS NOT NULL AS has_dlq`,
      );
      details.pingMs = Date.now() - t0;
      details.queue = rows[0]?.has_jobs ? "ok" : "missing";
      details.circuit = rows[0]?.has_circuit ? "ok" : "missing";
      details.attempts = rows[0]?.has_attempts ? "ok" : "missing";
      details.deadLetters = rows[0]?.has_dlq ? "ok" : "missing";
      details.schema = "ok";

      if (!rows[0]?.has_jobs || !rows[0]?.has_circuit) {
        ready = false;
      }

      // Probe required base columns (enterprise_reliability). Hardening columns
      // (next_retry_at, completed_at) are preferred but code degrades until migration.
      if (rows[0]?.has_jobs) {
        try {
          await pool.query(
            `SELECT locked_at, locked_by, last_error_code, attempt_count, idempotency_key, lease_expires_at, next_run_at
             FROM background_jobs
             WHERE false`,
          );
          details.queueColumns = "ok";
        } catch (colErr) {
          ready = false;
          details.queueColumns = "missing_base_columns";
          console.error(
            JSON.stringify({
              level: "error",
              msg: "readyz_queue_columns_missing",
              error: colErr instanceof Error ? colErr.message : String(colErr),
              hint: "Apply supabase/enterprise_reliability_p0_v1.sql",
              ts: new Date().toISOString(),
            }),
          );
        }

        try {
          await pool.query(
            `SELECT next_retry_at, completed_at FROM background_jobs WHERE false`,
          );
          details.hardeningColumns = "ok";
        } catch {
          details.hardeningColumns = "pending_migration";
          console.error(
            JSON.stringify({
              level: "warn",
              msg: "readyz_hardening_columns_pending",
              hint: "Apply supabase/background_jobs_runtime_hardening_v1.sql (approval required)",
              ts: new Date().toISOString(),
            }),
          );
        }

        try {
          const { rows: depthRows } = await pool.query(
            `SELECT
               COUNT(*) FILTER (WHERE status = 'queued')::int AS queued,
               COUNT(*) FILTER (WHERE status = 'running')::int AS running,
               COUNT(*) FILTER (WHERE status = 'dead_letter')::int AS dlq
             FROM background_jobs`,
          );
          const { setGauge } = await import("../observability/metrics.mjs");
          setGauge("queue.depth", (depthRows[0]?.queued || 0) + (depthRows[0]?.running || 0));
          setGauge("queue.dlq_count", depthRows[0]?.dlq || 0);
          details.queueDepth = depthRows[0]?.queued ?? null;
          details.dlqCount = depthRows[0]?.dlq ?? null;
        } catch {
          details.queueDepth = "unavailable";
        }

        try {
          const { rows: spendTables } = await pool.query(
            `SELECT to_regclass('public.ai_spend_ledger') IS NOT NULL AS has_spend`,
          );
          details.aiSpendLedger = spendTables[0]?.has_spend ? "ok" : "pending_migration";
        } catch {
          details.aiSpendLedger = "unavailable";
        }
      }
    }
  } catch (err) {
    ready = false;
    details.schema = "error";
    console.error(
      JSON.stringify({
        level: "error",
        msg: "readyz_failed",
        error: err instanceof Error ? err.message : String(err),
        ts: new Date().toISOString(),
      }),
    );
  }

  if (!ready) {
    console.error(JSON.stringify({ level: "error", msg: "readyz_not_ready", details, version }));
  }

  sendJson(res, ready ? 200 : 503, {
    status: ready ? "ok" : "not_ready",
    version: String(version).slice(0, 40),
  });
}
