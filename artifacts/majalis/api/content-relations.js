import { sendJson } from "./_http.js";
import { getRelatedContent, recordInteraction } from "../lib/scholarly-intelligence/recommendations.mjs";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const params = req.method === "POST" ? req.body || {} : req.query || {};
  const { kind, recordId, topicSlug, query, userId, limit } = params;
  const admin = getSupabaseAdmin();

  if (req.method === "POST" && params.action === "interact") {
    await recordInteraction(admin, { userId, kind, topicSlug, query });
    sendJson(res, 200, { ok: true });
    return;
  }

  try {
    const result = await getRelatedContent(admin, {
      kind,
      recordId,
      topicSlug,
      query,
      userId,
      limit: Math.min(Number(limit || 8), 20),
    });
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
