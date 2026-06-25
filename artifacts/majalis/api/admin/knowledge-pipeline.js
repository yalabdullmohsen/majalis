import { sendJson } from "../_http.js";
import { runKnowledgeSync, getKnowledgePipelineStats } from "../../lib/knowledge-sync.mjs";
import { getRecommendations, searchHybrid } from "../../lib/knowledge-engine/recommendations.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";

function verifyAdminAuth(req) {
  const secret = String(process.env.ADMIN_API_SECRET || process.env.CRON_SECRET || "").trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = String(req.headers.authorization || "");
  return auth === `Bearer ${secret}`;
}

export default async function handler(req, res) {
  if (!verifyAdminAuth(req)) {
    sendJson(res, 401, { ok: false, message: "غير مصرح." });
    return;
  }

  const action = req.query?.action || req.body?.action || "stats";
  const admin = getSupabaseAdmin();

  try {
    if (action === "stats") {
      const days = Number(req.query?.days || 7);
      const result = await getKnowledgePipelineStats(days);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "run") {
      const maxItems = Number(req.body?.maxItems || 50);
      const skipPublish = Boolean(req.body?.skipPublish);
      const result = await runKnowledgeSync({ triggerType: "manual", maxItems, skipPublish });
      sendJson(res, 200, result);
      return;
    }

    if (action === "search") {
      const query = String(req.query?.q || req.body?.q || "").trim();
      if (!query) {
        sendJson(res, 400, { ok: false, message: "استعلام مطلوب." });
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
        ? await getRecommendations(admin, { kind, recordId, limit })
        : { items: [], algorithm: "none" };
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    sendJson(res, 400, { ok: false, message: "إجراء غير معروف." });
  } catch (error) {
    console.error("[admin/knowledge-pipeline] failed", error);
    sendJson(res, 500, { ok: false, message: String(error.message || error) });
  }
}
