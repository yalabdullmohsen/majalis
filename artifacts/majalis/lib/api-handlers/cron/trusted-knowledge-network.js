/**
 * Cron — Trusted Knowledge Network (Phase 5).
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import {
  processRetryQueue,
  runHealthCheck,
  runTknFetch,
} from "../../../lib/trusted-knowledge-network/index.mjs";

const PATH_MODE_MAP = {
  "/api/cron/tkn-retry-queue": "retry",
  "/api/cron/tkn-health": "health",
  "/api/cron/tkn-fetch": "fetch",
};

function resolveMode(req) {
  const fromQuery = req.query?.mode || req.body?.mode;
  if (fromQuery) return fromQuery;

  const url = String(req.url || req.path || "");
  for (const [path, mode] of Object.entries(PATH_MODE_MAP)) {
    if (url.includes(path.replace("/api/cron/", "")) || url.startsWith(path)) return mode;
  }

  const pathOnly = url.split("?")[0];
  if (PATH_MODE_MAP[pathOnly]) return PATH_MODE_MAP[pathOnly];

  return "retry";
}

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const mode = resolveMode(req);
  const batchSize = Number(req.query?.batchSize) || 10;

  try {
    if (mode === "health") {
      const health = await runHealthCheck();
      sendJson(res, health.ok ? 200 : 503, health);
      return;
    }

    if (mode === "fetch") {
      const result = await runTknFetch({
        contentType: req.query?.contentType || undefined,
      });
      sendJson(res, 200, { ok: true, mode: "fetch", result });
      return;
    }

    const result = await processRetryQueue(batchSize);
    sendJson(res, result.ok ? 200 : 500, { ok: result.ok, mode: "retry", ...result });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
