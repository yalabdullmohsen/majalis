/**
 * Graph expansion — enrich evidence via content_relations BFS.
 */

import { getRelationGraph } from "../global-reference/relations.mjs";
import { resolveGlobalRef } from "../global-reference/ids.mjs";
import { toCitation } from "./citations.mjs";

export async function expandEvidenceGraph(admin, citations, opts = {}) {
  if (!admin || !citations?.length) {
    return { nodes: [], edges: [], expanded: [] };
  }

  const depth = opts.depth ?? 1;
  const maxNodes = opts.maxNodes ?? 40;
  const nodeMap = new Map();
  const allEdges = [];
  const expanded = [];

  for (const cite of citations.slice(0, 8)) {
    const refId = cite.ref_id;
    if (!refId || nodeMap.size >= maxNodes) continue;

    const graph = await getRelationGraph(admin, refId, depth);
    for (const node of graph.nodes || []) {
      if (!nodeMap.has(node.ref_id)) nodeMap.set(node.ref_id, node);
    }
    for (const edge of graph.edges || []) {
      allEdges.push(edge);
    }
  }

  for (const [refId] of nodeMap) {
    if (expanded.length >= 15) break;
    const resolved = await resolveGlobalRef(admin, refId);
    if (!resolved?.title) continue;
    expanded.push(toCitation({
      ref_id: refId,
      content_kind: resolved.content_kind,
      id: resolved.record_id,
      title: resolved.title,
      source_name: resolved.publisher,
      verification_status: resolved.verification_status,
      updated_at: resolved.updated_at,
    }));
  }

  return {
    nodes: [...nodeMap.values()],
    edges: allEdges,
    expanded,
    nodeCount: nodeMap.size,
    edgeCount: allEdges.length,
  };
}
