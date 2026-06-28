/**
 * Cron — Autonomous Knowledge Platform v3 (zero manual operation cycle).
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth, getEnvStatus } from "../../../lib/env-config.mjs";
import { buildMissingSecretPayload } from "../../../lib/secret-errors.mjs";
import { runAutonomousPlatformV3, maybeRunAutoActivation } from "../../../lib/autonomous-platform/v3/index.mjs";

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
    sendJson(res, 401, { ok: false, error: "Unauthorized", code: "Missing or invalid CRON_SECRET" });
    return;
  }

  const env = getEnvStatus();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    sendJson(res, 503, buildMissingSecretPayload(["SUPABASE_SERVICE_ROLE_KEY"], "AKP v3 cron requires server-side Supabase access"));
    return;
  }

  const mode = resolveMode(req);

  if (["full", "health"].includes(mode)) {
    const activation = await maybeRunAutoActivation().catch((err) => ({ ok: false, error: err.message }));
    if (mode === "health" && activation?.skipped && activation.reason === "secrets_incomplete") {
      sendJson(res, 503, {
        ...buildMissingSecretPayload(activation.missing || ["DATABASE_URL"], "Auto-activation blocked"),
        activation,
      });
      return;
    }
  }

  try {
    const result = await runAutonomousPlatformV3({ mode, triggerType: "cron_v3" });
    sendJson(res, result.ok !== false ? 200 : 500, result);
  } catch (err) {
    console.error("[cron/autonomous-platform-v3]", err);
    const msg = String(err.message || err);
    if (msg.includes("SERVICE_ROLE") || msg.includes("no_admin")) {
      sendJson(res, 503, buildMissingSecretPayload(["SUPABASE_SERVICE_ROLE_KEY"], msg));
      return;
    }
    sendJson(res, 500, { ok: false, error: msg, code: msg });
  }
}
