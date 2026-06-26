import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { searchHybrid } from "../../lib/knowledge-engine/recommendations.mjs";
import { searchEverything } from "../../lib/knowledge-search-bridge.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const query = String(req.query?.q || req.body?.q || "").trim();
  if (!query) {
    sendJson(res, 400, { ok: false, message: "استعلام مطلوب." });
    return;
  }

  const limit = Number(req.query?.limit || req.body?.limit || 20);
  const admin = getSupabaseAdmin();

  try {
    const [knowledge, platform] = await Promise.all([
      admin ? searchHybrid(admin, query, limit) : Promise.resolve([]),
      searchEverything(query, limit),
    ]);

    const merged = mergeSearchResults(knowledge, platform, limit);
    sendJson(res, 200, {
      ok: true,
      query,
      count: merged.length,
      results: merged,
      sources: {
        knowledge: knowledge.length,
        platform: platform.length,
      },
    });
  } catch (error) {
    console.error("[knowledge-search] failed", error);
    sendJson(res, 500, { ok: false, message: "فشل البحث." });
  }
}

function mergeSearchResults(knowledge, platform, limit) {
  const seen = new Set();
  const merged = [];

  for (const item of knowledge) {
    const key = `${item.content_kind}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      ...item,
      source: "knowledge",
      rank: (item.rank || 0) + (item.verification_status === "verified" ? 5 : 0),
    });
  }

  for (const item of platform) {
    const key = `${item.kind || item.type}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      ...item,
      source: "platform",
      rank: item.rank || item.score || 0,
    });
  }

  return merged
    .sort((a, b) => (b.rank || 0) - (a.rank || 0))
    .slice(0, limit);
}
