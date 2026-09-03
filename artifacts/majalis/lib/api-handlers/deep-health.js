/**
 * GET /api/deep-health — فحص جاهزية ثقيل (DB/طابور/منصة).
 * محمي بـ CRON_SECRET — ليس لمسارات App Store أو probes العامة.
 * استخدم /api/healthz و /api/readyz (lite) للفحوص السريعة.
 */
import { sendJson } from "../api/_http.mjs";
import { validateCronAuth } from "../env-config.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const version = String(
    process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GIT_COMMIT ||
      process.env.npm_package_version ||
      "unknown",
  ).slice(0, 40);

  const out = {
    ok: true,
    service: "ssunnah-web",
    version,
    at: new Date().toISOString(),
    platform: null,
    readyz: null,
  };

  try {
    const { getPlatformHealth } = await import("../platform-health.mjs");
    out.platform = await getPlatformHealth({ skipRemote: false });
    if (!out.platform?.ok) out.ok = false;
  } catch (err) {
    out.ok = false;
    out.platform = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  try {
    const { classifyDurablePgError, DURABLE_REASONS, isProductionRuntime, publicReadyReason } =
      await import("../reliability/env.mjs");
    const checks = {
      app_alive: true,
      database_reachable: false,
      queue_tables_ready: false,
      queue_hardening_columns_ready: false,
      ai_circuit_table_ready: false,
    };
    let ready = true;
    let reason = null;
    let ping_ms = null;

    const { getPgPool } = await import("../database.mjs");
    const pool = typeof getPgPool === "function" ? await getPgPool() : null;
    if (!pool) {
      ready = false;
      reason = isProductionRuntime()
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
      ping_ms = Date.now() - t0;
      checks.database_reachable = true;
      checks.queue_tables_ready = Boolean(rows[0]?.has_jobs);
      checks.ai_circuit_table_ready = Boolean(rows[0]?.has_circuit);
      if (!checks.queue_tables_ready || !checks.ai_circuit_table_ready) {
        ready = false;
        reason = DURABLE_REASONS.queue_schema_missing;
      }
      if (rows[0]?.has_jobs) {
        try {
          await pool.query(
            `SELECT locked_at, locked_by, last_error_code, attempt_count, idempotency_key,
                    lease_expires_at, next_run_at, max_attempts, status, job_type
             FROM public.background_jobs WHERE false`,
          );
        } catch (colErr) {
          ready = false;
          reason = classifyDurablePgError(colErr);
        }
        try {
          await pool.query(
            `SELECT next_retry_at, completed_at FROM public.background_jobs WHERE false`,
          );
          checks.queue_hardening_columns_ready = true;
        } catch {
          checks.queue_hardening_columns_ready = false;
        }
      }
    }

    out.readyz = {
      status: ready ? "ok" : "not_ready",
      checks,
      ping_ms,
      reason: ready ? null : publicReadyReason(reason),
    };
    if (!ready) out.ok = false;
  } catch (err) {
    out.ok = false;
    out.readyz = {
      status: "not_ready",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  sendJson(res, out.ok ? 200 : 503, out, {
    "Cache-Control": "private, no-store",
  });
}
