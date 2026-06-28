/**
 * Cron — Autonomous Knowledge Platform v3 (zero manual operation cycle).
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runAutonomousPlatformV3 } from "../../../lib/autonomous-platform/v3/index.mjs";

const PATH_MODE_MAP = {
  "/api/cron/autonomous-platform-v3": "full",
  "/api/cron/autonomous-platform-v3-health": "health",
  "/api/cron/autonomous-platform-v3-goals": "goals",
  "/api/cron/autonomous-platform-v3-analytics": "analytics",
  "/api/cron/autonomous-platform-v3-backup": "backup",
  "/api/cron/autonomous-platform-v3-heal": "heal",
};

function resolveMode(req) {
  const fromQuery = req.query?.mode || req.body?.mode;
  if (fromQuery) return fromQuery;
  const url = String(req.url || req.path || "").split("?")[0];
  for (const [path, mode] of Object.entries(PATH_MODE_MAP)) {
    if (url.startsWith(path) || url.includes(path.replace("/api/cron/", ""))) return mode;
  }
  return "full";
}

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const mode = resolveMode(req);
  try {
    const result = await runAutonomousPlatformV3({ mode, triggerType: "cron_v3" });
    sendJson(res, result.ok !== false ? 200 : 500, result);
  } catch (err) {
    console.error("[cron/autonomous-platform-v3]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
