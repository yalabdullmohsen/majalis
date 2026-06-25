/**
 * Recommendation engine — suggests related content by category, keywords, scholar.
 */

function normalizeText(t) {
  return String(t || "").replace(/[\u064B-\u065F\u0670]/g, "").toLowerCase().trim();
}

function keywordOverlap(a, b) {
  const setA = new Set((a || []).map(normalizeText));
  const setB = new Set((b || []).map(normalizeText));
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const k of setA) if (setB.has(k)) inter++;
  return inter / Math.max(setA.size, setB.size);
}

export function scoreRelatedness(source, candidate) {
  let score = 0;

  if (source.content_kind === candidate.content_kind) score += 25;
  if (source.ai_category && source.ai_category === candidate.ai_category) score += 30;
  if (source.ai_topic && source.ai_topic === candidate.ai_topic) score += 15;
  if (source.ai_scholar && source.ai_scholar === candidate.ai_scholar) score += 20;

  score += keywordOverlap(source.ai_keywords, candidate.ai_keywords) * 25;

  score += (candidate.quality_score || 0) * 0.1;
  score += (candidate.trust_score || 0) * 0.05;

  if (candidate.verification_status === "verified") score += 10;

  return Math.round(score * 100) / 100;
}

export function recommendRelated(source, candidates, limit = 8) {
  return candidates
    .filter((c) => c.id !== source.id)
    .map((c) => ({ ...c, relevance_score: scoreRelatedness(source, c) }))
    .filter((c) => c.relevance_score >= 15)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit);
}

export async function getRecommendations(admin, { kind, recordId, userId, limit = 8 }) {
  let source = null;

  if (recordId) {
    const { data } = await admin
      .from("knowledge_items")
      .select("*")
      .eq("target_record_id", recordId)
      .eq("publish_status", "published")
      .maybeSingle();
    source = data;
  }

  if (!source && kind) {
    const { data } = await admin
      .from("knowledge_items")
      .select("*")
      .eq("content_kind", kind)
      .eq("publish_status", "published")
      .order("quality_score", { ascending: false })
      .limit(1)
      .maybeSingle();
    source = data;
  }

  if (!source) return { items: [], algorithm: "none" };

  const { data: candidates } = await admin
    .from("knowledge_items")
    .select("id, content_kind, ai_title, ai_summary, ai_category, ai_topic, ai_scholar, ai_keywords, quality_score, trust_score, verification_status, target_record_id, source_url")
    .eq("publish_status", "published")
    .neq("id", source.id)
    .limit(50);

  const items = recommendRelated(source, candidates || [], limit);

  if (userId || recordId) {
    void admin.from("knowledge_recommendations").insert({
      user_id: userId || null,
      source_kind: source.content_kind,
      source_id: source.id,
      recommended_ids: items.map((i) => i.id),
      algorithm: "hybrid",
      score_map: Object.fromEntries(items.map((i) => [i.id, i.relevance_score])),
    });
  }

  return {
    items: items.map((i) => ({
      id: i.id,
      title: i.ai_title,
      summary: i.ai_summary,
      category: i.ai_category,
      kind: i.content_kind,
      score: i.relevance_score,
      url: i.source_url,
      record_id: i.target_record_id,
    })),
    algorithm: "hybrid",
    source_title: source.ai_title,
  };
}

export async function searchHybrid(admin, query, limit = 20) {
  const { data, error } = await admin.rpc("search_knowledge_hybrid", {
    query,
    result_limit: limit,
  });
  if (error || !data) return [];
  return Array.isArray(data) ? data : [];
}
