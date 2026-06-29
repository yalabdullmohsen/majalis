/**
 * Deduplication Engine — hash, external key, semantic layers (Phase 5 full impl).
 */
import { layerStatus } from "./_helpers.mjs";
import { GKE_DELEGATES } from "../config.mjs";

const LAYER_ID = "deduplication_engine";
const LAYER_PHASE = 5;

export function getStatus() {
  return layerStatus(LAYER_ID, "Deduplication Engine", LAYER_PHASE, 1, GKE_DELEGATES.deduplication);
}

/** @param {import('../types.mjs').GkePipelineItem} item @param {import('../types.mjs').GkePipelineItem[]} existing */
export async function deduplicate(item, existing = []) {
  const key = item.external_key || `${item.source_id}:${item.title}`;
  const dup = existing.find((e) => e.external_key === key);
  return {
    ok: true,
    layer: LAYER_ID,
    phase: LAYER_PHASE,
    data: { isDuplicate: Boolean(dup), key, strategy: "external_key" },
  };
}
