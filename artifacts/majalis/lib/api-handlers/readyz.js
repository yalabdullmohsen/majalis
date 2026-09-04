/**
 * GET/POST /api/readyz — جاهزية سريعة افتراضيًا (عملية حيّة فقط).
 * الفحص الثقيل لقاعدة البيانات عبر ?deep=1 فقط.
 */
import { sendJson } from "../api/_http.mjs";
import {
  classifyDurablePgError,
  DURABLE_REASONS,
  isProductionRuntime,
  publicReadyReason,
} from "../reliability/env.mjs";

function wantsDeep(req) {
  try {
    const q = req.query?.deep;
    if (q === "1" || q === "true") return true;
    const raw = String(req.url || "");
    return /[?&]deep=(1|true)(?:&|$)/i.test(raw);
  } catch {
    return false;
  }
}

function versionStamp() {
  return String(
    process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GIT_COMMIT ||
      process.env.npm_package_version ||
      "unknown",
  ).slice(0, 40);
}

export default async function handler(req, res) {
  const deep = wantsDeep(req);

  // المسار السريع: لا يستورد database ولا يفتح pool — مناسب لـ probes / CDN.
  if (!deep) {
    sendJson(
      res,
      200,
      {
        status: "ok",
        service: "ssunnah-web",
        checks: {
          app_alive: true,
        },
      },
      {
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
        "CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    );
    return;
  }

  // الفحص العميق داخلي فقط — يتطلب سرًا مشتركًا؛ لا تُكشف جداول/أعمدة للعامة.
  const deepSecret =
    process.env.READYZ_DEEP_SECRET ||
    process.env.CRON_SECRET ||
    process.env.INTERNAL_HEALTH_SECRET ||
    "";
  const provided =
    req.headers?.["x-readyz-secret"] ||
    req.headers?.["x-cron-secret"] ||
    req.headers?.authorization?.replace(/^Bearer\s+/i, "") ||
    "";
  if (isProductionRuntime() && (!deepSecret || provided !== deepSecret)) {
    sendJson(res, 401, {
      status: "unauthorized",
      service: "ssunnah-web",
      checks: { app_alive: true },
    });
    return;
  }

  const checks = {
    app_alive: true,
    database_reachable: false,
    queue_tables_ready: false,
    queue_hardening_columns_ready: false,
    ai_circuit_table_ready: false,
    deep: true,
  };

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
          console.error(
            JSON.stringify({
              level: "warn",
              msg: "readyz_hardening_columns_pending",
              hint: "Review background_jobs_runtime_hardening_v1.sql (manual apply)",
              ts: new Date().toISOString(),
            }),
          );
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
        checks: {
          app_alive: checks.app_alive,
          database_reachable: checks.database_reachable,
          deep: true,
        },
        reason: details.reason,
        version: versionStamp().slice(0, 7),
      }),
    );
  }

  // للعامة حتى مع السر: لا تُرجع أسماء جداول داخلية — فقط حيّة قاعدة البيانات
  const publicChecks = {
    app_alive: checks.app_alive,
    database_ok: checks.database_reachable && checks.queue_tables_ready && checks.ai_circuit_table_ready,
    deep: true,
  };

  const payload = {
    status: ready ? "ok" : "not_ready",
    service: "ssunnah-web",
    checks: publicChecks,
  };
  if (!ready) {
    payload.reason = publicReadyReason(details.reason);
  }
  sendJson(res, ready ? 200 : 503, payload);
}
