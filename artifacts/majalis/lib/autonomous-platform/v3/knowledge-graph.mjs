/**
 * AKP v3 — Knowledge Graph auto-linking.
 */
import { upsertGraphNode, createGraphEdge } from "../../reasoning-engine/knowledge-graph.mjs";
import { buildGlobalRef } from "../../global-reference/ids.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";

const CONTENT_RELATIONS = {
  hadith: ["benefits", "rulings", "questions"],
  benefits: ["hadith", "rulings", "lessons"],
  questions: ["rulings", "hadith"],
  rulings: ["questions", "hadith"],
  stories: ["lessons", "books"],
  lessons: ["sheikhs", "books"],
  books: ["lessons", "articles"],
  articles: ["books", "benefits"],
};

export async function linkPublishedContent({ contentType, record }) {
  const admin = getSupabaseAdmin();
  const refId = buildGlobalRef(contentType, record.id || record.external_key || record.title);
  const title = record.title || record.text || record.question || refId;

  const node = await upsertGraphNode(admin, {
    ref_id: refId,
    node_kind: contentType,
    title: String(title).slice(0, 200),
    stable_id: record.id || record.external_key,
    keywords: record.keywords || [],
    trust_level: record.trust_level || record.trust_score || 80,
    verification_status: record.verification_status || "verified",
    metadata: { source: "akp_v3", table: contentType },
  });

  const relatedTypes = CONTENT_RELATIONS[contentType] || [];
  const edges = [];

  for (const relType of relatedTypes) {
    const related = await findRelatedContent(admin, relType, title);
    for (const rel of related.slice(0, 3)) {
      const edge = await createGraphEdge(admin, {
        from_ref_id: refId,
        to_ref_id: rel.ref_id,
        relation_type: "related",
        confidence_score: rel.score || 70,
        auto_generated: true,
      });
      edges.push(edge);
    }
  }

  return { ok: node.ok, refId, node, edgesCreated: edges.filter((e) => e.ok).length };
}

async function findRelatedContent(admin, contentType, title) {
  if (!admin) return [];
  const q = String(title || "").slice(0, 40);
  if (!q) return [];

  const tableMap = {
    benefits: "fawaid",
    hadith: "verified_hadith_items",
    questions: "qa_questions",
    rulings: "sharia_rulings",
    lessons: "lessons",
    books: "library_items",
  };

  const table = tableMap[contentType];
  if (!table) return [];

  try {
    const col = contentType === "questions" ? "question" : contentType === "benefits" ? "text" : "title";
    const { data } = await admin.from(table).select("id, title, text, question").ilike(col, `%${q.slice(0, 20)}%`).limit(5);
    return (data || []).map((row) => ({
      ref_id: buildGlobalRef(contentType, row.id),
      score: 75,
    }));
  } catch {
    return [];
  }
}

export async function getKnowledgeGraphNeighbors(refId, { limit = 10 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, neighbors: [] };

  const { data: edges } = await admin
    .from("kg_edges")
    .select("from_ref_id, to_ref_id, relation_type, confidence_score")
    .or(`from_ref_id.eq.${refId},to_ref_id.eq.${refId}`)
    .limit(limit);

  return { ok: true, refId, edges: edges || [] };
}
