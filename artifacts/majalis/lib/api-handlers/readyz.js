/**
 * GET/POST /api/readyz — readiness (light schema/store checks).
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
  const details = { schema: null, queue: null, circuit: null };

  try {
    const { getPgPool } = await import("../database.mjs");
    const pool = typeof getPgPool === "function" ? await getPgPool() : null;
    if (!pool) {
      ready = false;
      details.schema = "no_pool";
    } else {
      const { rows } = await pool.query(
        `SELECT
           to_regclass('public.background_jobs') IS NOT NULL AS has_jobs,
           to_regclass('public.ai_provider_circuit') IS NOT NULL AS has_circuit`,
      );
      details.queue = rows[0]?.has_jobs ? "ok" : "missing";
      details.circuit = rows[0]?.has_circuit ? "ok" : "missing";
      if (!rows[0]?.has_jobs || !rows[0]?.has_circuit) ready = false;
      details.schema = "ok";
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
