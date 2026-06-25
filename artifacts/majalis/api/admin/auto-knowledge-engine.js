import { sendJson } from "../_http.js";
import { validateAdminAuth } from "../../lib/env-config.mjs";
import {
  runAutoKnowledgeEngine,
  runConnectorHealthChecks,
  getAutoKnowledgeEngineStats,
  runFullKnowledgeSync,
  runWeeklyMaintenance,
  getPublicRecommendations,
} from "../../lib/auto-knowledge-sync.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { searchHybrid } from "../../lib/knowledge-engine/recommendations.mjs";
import { getSystemHealth } from "../../lib/system-health.mjs";

export default async function handler(req, res) {
  if (!validateAdminAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "stats";
  const admin = getSupabaseAdmin();

  try {
    if (action === "stats") {
      const days = Number(req.query?.days || 7);
      const result = await getAutoKnowledgeEngineStats(days);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "system") {
      const health = await getSystemHealth();
      sendJson(res, health.ok ? 200 : 503, health);
      return;
    }

    if (action === "run") {
      const result = await runFullKnowledgeSync({
        triggerType: "manual",
        maxItems: Number(req.body?.maxItems || 40),
        checkLinks: Boolean(req.body?.checkLinks),
        connectorSlug: req.body?.connectorSlug,
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "run-engine") {
      const result = await runAutoKnowledgeEngine({
        triggerType: "manual",
        connectorSlug: req.query?.slug || req.body?.connectorSlug,
        checkLinks: Boolean(req.body?.checkLinks),
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "health") {
      const result = await runConnectorHealthChecks();
      sendJson(res, 200, result);
      return;
    }

    if (action === "maintenance") {
      const result = await runWeeklyMaintenance();
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "search") {
      const query = String(req.query?.q || req.body?.q || "").trim();
      if (!query) {
        sendJson(res, 400, { ok: false, error: "query required" });
        return;
      }
      const items = admin ? await searchHybrid(admin, query) : [];
      sendJson(res, 200, { ok: true, items, count: items.length });
      return;
    }

    if (action === "recommend") {
      const kind = req.query?.kind || req.body?.kind;
      const recordId = req.query?.recordId || req.body?.recordId;
      const limit = Number(req.query?.limit || 8);
      const result = admin
        ? await getPublicRecommendations(admin, { kind, recordId, limit })
        : { items: [], algorithm: "none" };
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    sendJson(res, 400, { ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("[admin/auto-knowledge-engine]", error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
