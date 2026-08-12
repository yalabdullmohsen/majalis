/**
 * Semantic + hybrid search via embeddings and FTS.
 */

import { generateEmbedding } from "../knowledge-engine/indexer.mjs";
import { searchHybrid } from "../knowledge-engine/recommendations.mjs";
import { processQuery } from "./query-processor.mjs";

export async function searchSemantic(admin, query, limit = 20) {
  if (!admin) return [];

  const embedding = await generateEmbedding(query);
  if (!embedding) return [];

  try {
    const { data, error } = await admin.rpc("ake_search_semantic", {
      query_embedding: embedding,
      result_limit: limit,
      min_similarity: 0.65,
    });
    if (error || !data) return [];

    return (Array.isArray(data) ? data : []).map((row) => ({
      ...row,
      content_kind: row.content_kind || "knowledge",
      kind: row.content_kind || "knowledge",
      source: "semantic",
      semantic_score: row.similarity,
      rank: (row.similarity || 0) * 10,
    }));
  } catch {
    return [];
  }
}

export async function searchKnowledgeAll(admin, query, limit = 20) {
  if (!admin) return [];

  const queryInfo = processQuery(query);
  const searchQuery = queryInfo.searchString || query;

  const [hybrid, semantic] = await Promise.all([
    searchHybrid(admin, searchQuery, limit),
    searchSemantic(admin, searchQuery, Math.ceil(limit / 2)),
  ]);

  const seen = new Set();
  const merged = [];

  for (const item of [...semantic, ...hybrid]) {
    const key = item.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push({
      ...item,
      title: item.title || item.ai_title,
      summary: item.summary || item.ai_summary,
      category: item.category || item.ai_category,
      scholar: item.scholar || item.ai_scholar,
      content_kind: item.content_kind || "knowledge",
      kind: item.content_kind || "knowledge",
    });
  }

  return merged.slice(0, limit);
}
