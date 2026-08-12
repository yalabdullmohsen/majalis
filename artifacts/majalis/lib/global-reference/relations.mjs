/**
 * Content relations — knowledge graph edge management.
 */

import { buildGlobalRef, identityFromItem } from "./ids.mjs";
import { matchTopicsToContent } from "../scholarly-intelligence/topics.mjs";

export const RELATION_TYPES = [
  "cites", "related", "same_topic", "same_source", "duplicate",
  "explains", "supports", "quran", "hadith", "tafseer",
  "scholar", "book", "lesson", "fatwa", "decision", "topic", "keyword",
];

export async function createRelation(admin, { fromRefId, toRefId, relationType, score, metadata }) {
  if (!admin) return { ok: true, source: "local" };

  try {
    const { data, error } = await admin
      .from("content_relations")
      .upsert(
        {
          from_ref_id: fromRefId,
          to_ref_id: toRefId,
          relation_type: relationType,
          relevance_score: score ?? 0.5,
          auto_linked: true,
          metadata: metadata || {},
        },
        { onConflict: "from_ref_id,to_ref_id,relation_type" },
      )
      .select()
      .single();
    if (error) throw error;
    return { ok: true, relation: data };
  } catch {
    return { ok: false };
  }
}

export async function getRelations(admin, refId, { direction = "both", type } = {}) {
  if (!admin) return [];

  try {
    const relations = [];

    if (direction === "out" || direction === "both") {
      let q = admin.from("content_relations").select("*").eq("from_ref_id", refId);
      if (type) q = q.eq("relation_type", type);
      const { data } = await q;
      if (data) relations.push(...data.map((r) => ({ ...r, direction: "out" })));
    }

    if (direction === "in" || direction === "both") {
      let q = admin.from("content_relations").select("*").eq("to_ref_id", refId);
      if (type) q = q.eq("relation_type", type);
      const { data } = await q;
      if (data) relations.push(...data.map((r) => ({ ...r, direction: "in" })));
    }

    return relations;
  } catch {
    return [];
  }
}

export async function autoLinkRelations(admin, item) {
  const identity = identityFromItem(item);
  const fromRefId = identity.ref_id;
  const created = [];

  const text = [identity.title, item.summary, item.ai_summary, item.description].filter(Boolean).join(" ");
  const keywords = item.ai_keywords || item.keywords || [];

  const topicMatches = matchTopicsToContent(text, keywords);
  for (const { topic, score } of topicMatches.slice(0, 5)) {
    const toRefId = buildGlobalRef("topic", topic.slug);
    const result = await createRelation(admin, {
      fromRefId,
      toRefId,
      relationType: "topic",
      score: score / 100,
      metadata: { topic_title: topic.title },
    });
    if (result.ok) created.push(result.relation);
  }

  if (item.source_name || item.source_url) {
    const sourceSlug = (item.source_name || "unknown").toLowerCase().replace(/\s+/g, "-").slice(0, 40);
    const toRefId = buildGlobalRef("source", sourceSlug);
    await createRelation(admin, {
      fromRefId,
      toRefId,
      relationType: "same_source",
      score: 0.8,
      metadata: { source_name: item.source_name, source_url: item.source_url },
    });
  }

  for (const kw of keywords.slice(0, 8)) {
    const toRefId = buildGlobalRef("keyword", kw);
    await createRelation(admin, {
      fromRefId,
      toRefId,
      relationType: "keyword",
      score: 0.6,
      metadata: { keyword: kw },
    });
  }

  return { fromRefId, created: created.length, relations: created };
}

export async function getRelationGraph(admin, refId, depth = 1) {
  const nodes = new Map();
  const edges = [];

  async function traverse(id, currentDepth) {
    if (currentDepth > depth || nodes.has(id)) return;
    nodes.set(id, { ref_id: id, depth: currentDepth });

    const relations = await getRelations(admin, id);
    for (const rel of relations) {
      edges.push(rel);
      const nextId = rel.direction === "out" ? rel.to_ref_id : rel.from_ref_id;
      if (currentDepth < depth) await traverse(nextId, currentDepth + 1);
    }
  }

  await traverse(refId, 0);

  return {
    nodes: [...nodes.values()],
    edges,
    nodeCount: nodes.size,
    edgeCount: edges.length,
  };
}

export async function getRelationStats(admin) {
  if (!admin) return { total: 0, by_type: {} };

  try {
    const { count } = await admin.from("content_relations").select("*", { count: "exact", head: true });
    return { total: count || 0 };
  } catch {
    return { total: 0 };
  }
}
