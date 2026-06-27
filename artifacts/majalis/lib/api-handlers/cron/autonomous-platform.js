/**
 * Cron — Autonomous Knowledge Platform (Phase 2).
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runAutonomousPlatform, runHealthCheck } from "../../../lib/autonomous-platform/index.mjs";

const PATH_MODE_MAP = {
  "/api/cron/autonomous-platform-fetch": "fetch",
  "/api/cron/autonomous-platform-validate": "validate",
  "/api/cron/autonomous-platform-questions": "questions",
  "/api/cron/autonomous-platform-benefits": "benefits",
  "/api/cron/autonomous-platform-reindex": "reindex",
  "/api/cron/autonomous-platform-audit": "audit",
  "/api/cron/autonomous-platform-cleanup": "cleanup",
  "/api/cron/autonomous-platform-bootstrap": "bootstrap",
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

  return "full";
}

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const mode = resolveMode(req);

  try {
    if (mode === "health") {
      const health = await runHealthCheck();
      sendJson(res, health.ok ? 200 : 500, health);
      return;
    }

    const result = await runAutonomousPlatform({
      mode,
      triggerType: "cron",
      maxItems: Number(req.query?.maxItems) || undefined,
      force: req.query?.force === "1",
    });

    sendJson(res, result.ok ? 200 : 500, result);
  } catch (err) {
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
