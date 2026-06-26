/**
 * Phase 4 Knowledge Graph — canonical nodes/edges layered above global_content_refs.
 */

import { buildGlobalRef } from "../global-reference/ids.mjs";
import { createRelation } from "../global-reference/relations.mjs";
import { buildCitationSet, persistCitations } from "./citation-engine.mjs";

export const CORE_GRAPH_NODE_KINDS = [
  "quran", "surah", "ayah", "tafsir", "hadith", "hadith_grade", "narrator",
  "scholar", "fiqh_issue", "ijma", "khilaf", "fatwa", "source", "book",
  "chapter", "page", "edition", "verification", "topic",
];

export const CORE_GRAPH_RELATIONS = [
  "contains", "explains", "cites", "grades", "narrated_by", "authored_by",
  "discusses", "evidence_for", "has_ijma", "has_khilaf", "has_fatwa",
  "from_source", "in_book", "in_chapter", "on_page", "in_edition",
  "verified_by", "same_topic", "related", "supports", "conflicts_with",
];

function normalizeNode(input = {}) {
  const nodeKind = input.node_kind || input.content_kind || "topic";
  const stableId = input.stable_id || input.record_id || input.id || input.slug || input.title;
  const refId = input.ref_id || buildGlobalRef(nodeKind, stableId);
  return {
    ref_id: refId,
    node_kind: nodeKind,
    title: input.title || input.name || refId,
    stable_id: String(stableId || refId),
    keywords: input.keywords || [],
    source_refs: input.source_refs || input.references || [],
    trust_level: Math.max(0, Math.min(100, Number(input.trust_level || 90))),
    verification_status: input.verification_status || "needs_review",
    last_reviewed_at: input.last_reviewed_at || null,
    metadata: input.metadata || {},
    updated_at: new Date().toISOString(),
  };
}

export async function upsertGraphNode(admin, input) {
  const node = normalizeNode(input);
  if (!admin) return { ok: true, node, local: true };
  try {
    const { data, error } = await admin
      .from("kg_nodes")
      .upsert(node, { onConflict: "ref_id" })
      .select()
      .maybeSingle();
    if (error) throw error;
    return { ok: true, node: data || node };
  } catch (err) {
    return { ok: false, node, error: String(err?.message || err) };
  }
}

export async function createGraphEdge(admin, input) {
  if (!input?.from_ref_id || !input?.to_ref_id || input.from_ref_id === input.to_ref_id) {
    return { ok: false, error: "invalid_edge" };
  }

  const edge = {
    from_ref_id: input.from_ref_id,
    to_ref_id: input.to_ref_id,
    relation_type: input.relation_type || "related",
    confidence_score: Math.max(0, Math.min(100, Number(input.confidence_score || 75))),
    evidence_refs: input.evidence_refs || [],
    citation_id: input.citation_id || null,
    auto_generated: input.auto_generated !== false,
    audit_status: input.audit_status || "pending",
    metadata: input.metadata || {},
    created_by: input.created_by || "system",
    updated_at: new Date().toISOString(),
  };

  if (!admin) return { ok: true, edge, local: true };

  try {
    const { data, error } = await admin
      .from("kg_edges")
      .upsert(edge, { onConflict: "from_ref_id,to_ref_id,relation_type" })
      .select()
      .maybeSingle();
    if (error) throw error;

    // Keep existing graph API populated for current features.
    await createRelation(admin, {
      fromRefId: edge.from_ref_id,
      toRefId: edge.to_ref_id,
      relationType: edge.relation_type === "contains" ? "related" : edge.relation_type,
      score: edge.confidence_score / 100,
      metadata: { ...edge.metadata, phase4: true },
    }).catch(() => null);

    return { ok: true, edge: data || edge };
  } catch (err) {
    return { ok: false, edge, error: String(err?.message || err) };
  }
}

export function officialReferenceNodes() {
  const quran = normalizeNode({
    node_kind: "quran",
    stable_id: "quran",
    title: "القرآن الكريم",
    keywords: ["قرآن", "وحي", "سورة", "آية"],
    verification_status: "verified",
    trust_level: 100,
    source_refs: [{ name: "المصحف الشريف", type: "primary" }],
  });

  const hadithSources = [
    "صحيح البخاري",
    "صحيح مسلم",
    "سنن أبي داود",
    "سنن الترمذي",
    "سنن النسائي",
    "سنن ابن ماجه",
    "موطأ الإمام مالك",
    "مسند الإمام أحمد",
  ].map((title) => normalizeNode({
    node_kind: "book",
    stable_id: title,
    title,
    keywords: ["حديث", "سنة", title],
    verification_status: "verified",
    trust_level: title.includes("صحيح") ? 98 : 94,
    source_refs: [{ name: title, type: "canonical_hadith_source" }],
  }));

  const tafsirSources = [
    "تفسير الطبري",
    "تفسير ابن كثير",
    "تفسير البغوي",
    "تفسير السعدي",
  ].map((title) => normalizeNode({
    node_kind: "book",
    stable_id: title,
    title,
    keywords: ["تفسير", "قرآن", title],
    verification_status: "verified",
    trust_level: 94,
    source_refs: [{ name: title, type: "canonical_tafsir_source" }],
  }));

  return [quran, ...hadithSources, ...tafsirSources];
}

export async function seedOfficialKnowledgeGraph(admin) {
  const nodes = officialReferenceNodes();
  const results = { nodes: 0, edges: 0, errors: [] };

  for (const node of nodes) {
    const r = await upsertGraphNode(admin, node);
    if (r.ok) results.nodes += 1;
    else results.errors.push(r.error);
  }

  const quranRef = buildGlobalRef("quran", "quran");
  for (const node of nodes.filter((n) => n.node_kind === "book" && n.keywords.includes("تفسير"))) {
    const r = await createGraphEdge(admin, {
      from_ref_id: node.ref_id,
      to_ref_id: quranRef,
      relation_type: "explains",
      confidence_score: 92,
      evidence_refs: node.source_refs,
      metadata: { reason: "canonical_tafsir_source" },
    });
    if (r.ok) results.edges += 1;
    else results.errors.push(r.error);
  }

  return { ok: results.errors.length === 0, ...results };
}

export async function materializeEvidenceGraph(admin, citations = []) {
  const citationSet = buildCitationSet(citations);
  const persist = await persistCitations(admin, citationSet.citations);
  const results = { nodes: 0, edges: 0, citations: persist.persisted || 0, errors: [] };

  for (const citation of citationSet.citations) {
    const contentNode = await upsertGraphNode(admin, {
      ref_id: citation.content_ref_id,
      node_kind: citation.metadata?.content_kind || "topic",
      title: citation.title,
      stable_id: citation.content_ref_id || citation.citation_key,
      keywords: [],
      source_refs: [citation],
      trust_level: citation.trust_level,
      verification_status: citation.verification || "needs_review",
      metadata: { citation_key: citation.citation_key },
    });
    if (contentNode.ok) results.nodes += 1;
    else results.errors.push(contentNode.error);

    const sourceNode = await upsertGraphNode(admin, {
      ref_id: citation.source_ref_id || buildGlobalRef("source", citation.book_title),
      node_kind: "source",
      title: citation.book_title,
      stable_id: citation.book_title,
      source_refs: [citation],
      trust_level: citation.trust_level,
      verification_status: "verified",
      metadata: { author_name: citation.author_name, edition: citation.edition },
    });
    if (sourceNode.ok) results.nodes += 1;
    else results.errors.push(sourceNode.error);

    if (contentNode.node?.ref_id && sourceNode.node?.ref_id) {
      const edge = await createGraphEdge(admin, {
        from_ref_id: contentNode.node.ref_id,
        to_ref_id: sourceNode.node.ref_id,
        relation_type: "from_source",
        confidence_score: citation.trust_level,
        evidence_refs: [citation],
        metadata: { citation_key: citation.citation_key },
      });
      if (edge.ok) results.edges += 1;
      else results.errors.push(edge.error);
    }
  }

  return { ok: results.errors.length === 0, citation_set: citationSet, ...results };
}
