/**
 * Search Index Layer — central indexing for unified search.
 */
import { layerStatus } from "./_helpers.mjs";
import { GKE_DELEGATES } from "../config.mjs";
import { emit, GKE_EVENTS } from "../events.mjs";

const LAYER_ID = "search_index";
const LAYER_PHASE = 7;

export function getStatus() {
  return layerStatus(LAYER_ID, "Search Index", LAYER_PHASE, 1, GKE_DELEGATES.search_index);
}

/** @param {import('../types.mjs').GkePipelineItem} item */
export async function indexItem(item) {
  await emit(GKE_EVENTS.INDEX_UPDATE, { item });
  return { ok: true, layer: LAYER_ID, phase: LAYER_PHASE, data: { indexed: false, message: "Phase 7 — delegate to knowledge-engine/indexer" } };
}
