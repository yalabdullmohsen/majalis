/**
 * AKP v3 — AI Recommendations ("قد يعجبك أيضاً").
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { semanticSearch } from "./semantic-index.mjs";
import { getKnowledgeGraphNeighbors } from "./knowledge-graph.mjs";
import { buildGlobalRef } from "../../global-reference/ids.mjs";

export async function getPageRecommendations({ contentType, contentId, title, limit = 6 }) {
  const admin = getSupabaseAdmin();
  const refId = buildGlobalRef(contentType, contentId);
  const query = title || contentType;

  const [semantic, graph] = await Promise.all([
    semanticSearch(query, { limit: limit + 2, contentType: null }),
    getKnowledgeGraphNeighbors(refId, { limit: limit + 2 }),
  ]);

  const items = [];
  const seen = new Set([String(contentId)]);

  for (const r of semantic.results || []) {
    const id = r.id || r.content_id;
    if (!id || seen.has(String(id))) continue;
    seen.add(String(id));
    items.push({
      id,
      title: r.title || r.ai_title,
      summary: r.summary || r.body_excerpt,
      contentType: r.content_kind || r.content_type,
      score: r.rank || r.semantic_score || 0.7,
      reason: "semantic_similarity",
    });
  }

  if (admin && graph.edges?.length) {
    const refIds = graph.edges.map((e) => (e.from_ref_id === refId ? e.to_ref_id : e.from_ref_id));
    const { data: nodes } = await admin.from("kg_nodes").select("ref_id, title, node_kind").in("ref_id", refIds.slice(0, limit));
    for (const n of nodes || []) {
      if (seen.has(n.ref_id)) continue;
      seen.add(n.ref_id);
      items.push({
        id: n.ref_id,
        title: n.title,
        contentType: n.node_kind,
        score: 0.8,
        reason: "knowledge_graph",
      });
    }
  }

  return {
    ok: true,
    contentType,
    contentId,
    recommendations: items.slice(0, limit),
  };
}

export async function getTrendingRecommendations({ limit = 8 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, recommendations: [] };

  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data } = await admin
    .from("fawaid")
    .select("id, text, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    ok: true,
    recommendations: (data || []).map((r) => ({
      id: r.id,
      title: String(r.text).slice(0, 80),
      contentType: "benefits",
      reason: "trending",
    })),
  };
}
