/**
 * GET/POST /api/readyz — readiness (real store checks, no DDL / no migrations).
 * Public checks are boolean/status codes only — no secrets, no stack traces.
 */
import { sendJson } from "../api/_http.mjs";
import {
  classifyDurablePgError,
  DURABLE_REASONS,
  isProductionRuntime,
  publicReadyReason,
} from "../reliability/env.mjs";

export default async function handler(req, res) {
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT ||
    process.env.npm_package_version ||
    "unknown";

  const checks = {
    app_alive: true,
    database_reachable: false,
    queue_tables_ready: false,
    queue_hardening_columns_ready: false,
    ai_circuit_table_ready: false,
  };

  /** Internal diagnostics — logged only (plus allowlisted `reason` in JSON). */
  const details = {
    reason: null,
    attempts_table: null,
    dead_letters_table: null,
    queue_base_columns: null,
    ping_ms: null,
  };

  let ready = true;

  try {
    const { getPgPool } = await import("../database.mjs");
    const pool = typeof getPgPool === "function" ? await getPgPool() : null;
    if (!pool) {
      ready = false;
      // Production without a pool is almost always env wiring, not "healthy".
      details.reason = isProductionRuntime()
        ? DURABLE_REASONS.env_mismatch
        : DURABLE_REASONS.database_not_configured;
    } else {
      const t0 = Date.now();
      const { rows } = await pool.query(
        `SELECT
           to_regclass('public.background_jobs') IS NOT NULL AS has_jobs,
           to_regclass('public.ai_provider_circuit') IS NOT NULL AS has_circuit,
           to_regclass('public.background_job_attempts') IS NOT NULL AS has_attempts,
           to_regclass('public.background_job_dead_letters') IS NOT NULL AS has_dlq`,
      );
      details.ping_ms = Date.now() - t0;
      checks.database_reachable = true;

      checks.queue_tables_ready = Boolean(rows[0]?.has_jobs);
      checks.ai_circuit_table_ready = Boolean(rows[0]?.has_circuit);
      details.attempts_table = rows[0]?.has_attempts ? "ok" : "missing";
      details.dead_letters_table = rows[0]?.has_dlq ? "ok" : "missing";

      if (!checks.queue_tables_ready || !checks.ai_circuit_table_ready) {
        ready = false;
        details.reason = DURABLE_REASONS.queue_schema_missing;
      }

      if (rows[0]?.has_jobs) {
        try {
          await pool.query(
            `SELECT locked_at, locked_by, last_error_code, attempt_count, idempotency_key,
                    lease_expires_at, next_run_at, max_attempts, status, job_type
             FROM public.background_jobs
             WHERE false`,
          );
          details.queue_base_columns = "ok";
        } catch (colErr) {
          ready = false;
          details.queue_base_columns = "missing";
          details.reason = classifyDurablePgError(colErr);
          console.error(
            JSON.stringify({
              level: "error",
              msg: "readyz_queue_columns_missing",
              reason: details.reason,
              hint: "Review enterprise_reliability_p0_v1.sql (manual apply)",
              ts: new Date().toISOString(),
            }),
          );
        }

        try {
          await pool.query(
            `SELECT next_retry_at, completed_at FROM public.background_jobs WHERE false`,
          );
          checks.queue_hardening_columns_ready = true;
        } catch {
          checks.queue_hardening_columns_ready = false;
          // Soft: code degrades to next_run_at / finished_at until migration.
          console.error(
            JSON.stringify({
              level: "warn",
              msg: "readyz_hardening_columns_pending",
              hint: "Review background_jobs_runtime_hardening_v1.sql (manual apply)",
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
             FROM public.background_jobs`,
          );
          const { setGauge } = await import("../observability/metrics.mjs");
          setGauge("queue.depth", (depthRows[0]?.queued || 0) + (depthRows[0]?.running || 0));
          setGauge("queue.dlq_count", depthRows[0]?.dlq || 0);
        } catch {
          /* depth is non-blocking */
        }
      }
    }
  } catch (err) {
    ready = false;
    checks.database_reachable = false;
    details.reason = classifyDurablePgError(err);
    console.error(
      JSON.stringify({
        level: "error",
        msg: "readyz_failed",
        reason: details.reason,
        error: String(err instanceof Error ? err.message : err)
          .replace(/postgres(ql)?:\/\/[^@\s]+@/gi, "postgres://***@")
          .slice(0, 200),
        ts: new Date().toISOString(),
      }),
    );
  }

  if (!ready) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "readyz_not_ready",
        checks,
        reason: details.reason,
        version: String(version).slice(0, 40),
      }),
    );
  }

  // Never fake readiness: 503 stays 503. Public reason is allowlisted only.
  const payload = {
    status: ready ? "ok" : "not_ready",
    version: String(version).slice(0, 40),
    checks,
  };
  if (!ready) {
    payload.reason = publicReadyReason(details.reason);
  }
  sendJson(res, ready ? 200 : 503, payload);
}
