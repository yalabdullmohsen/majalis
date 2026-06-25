import { sendJson } from "./_http.js";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";
import { getPublicRecommendations } from "../lib/auto-knowledge-sync.mjs";
import { searchHybrid } from "../lib/knowledge-engine/recommendations.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const kind = req.query?.kind;
  const recordId = req.query?.recordId;
  const limit = Math.min(Number(req.query?.limit || 8), 20);
  const admin = getSupabaseAdmin();

  try {
    if (req.query?.q) {
      const query = String(req.query.q).trim();
      const items = admin ? await searchHybrid(admin, query, limit) : [];
      sendJson(res, 200, { ok: true, items, count: items.length });
      return;
    }

    const result = admin
      ? await getPublicRecommendations(admin, { kind, recordId, limit })
      : { items: [], algorithm: "none" };

    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
