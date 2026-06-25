import { sendJson } from "../_http.js";
import { validateAdminAuth } from "../../lib/env-config.mjs";
import {
  runAutoContentSync,
  getAutoContentPipelineStats,
  getAutoContentHealth,
} from "../../lib/auto-content/auto-content-sync.mjs";
import { getSystemHealth } from "../../lib/system-health.mjs";

export default async function handler(req, res) {
  if (!validateAdminAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "stats";

  try {
    if (action === "stats") {
      const limit = Number(req.query?.limit || 10);
      const result = await getAutoContentPipelineStats(limit);
      sendJson(res, 200, result);
      return;
    }

    if (action === "run") {
      const result = await runAutoContentSync({ triggerType: "manual" });
      sendJson(res, result.ok ? 200 : 503, result);
      return;
    }

    if (action === "health") {
      const health = await getAutoContentHealth();
      sendJson(res, health.ok ? 200 : 503, health);
      return;
    }

    if (action === "system") {
      const health = await getSystemHealth();
      sendJson(res, health.ok ? 200 : 503, health);
      return;
    }

    sendJson(res, 400, { ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("[admin/auto-content] failed", error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
