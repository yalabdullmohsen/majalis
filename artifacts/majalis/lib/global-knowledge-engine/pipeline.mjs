/**
 * GKE Pipeline — defines layer order and stage contracts.
 * Frontend never talks to sources directly; all flows through GKE layers.
 */

import { GKE_LAYERS } from "./config.mjs";

export const PIPELINE_FLOW = [
  "source_registry",
  "fetch_engine",
  "parser_engine",
  "normalization_engine",
  "ai_classification_engine",
  "deduplication_engine",
  "quality_engine",
  "review_queue",
  "cms_dispatcher",
  "search_index",
];

/** @returns {typeof GKE_LAYERS} */
export function getLayerDefinitions() {
  return GKE_LAYERS;
}

/** @param {string} layerId */
export function getLayerPhase(layerId) {
  return GKE_LAYERS.find((l) => l.id === layerId)?.phase ?? 99;
}

/** @param {number} currentPhase */
export function layersForPhase(currentPhase) {
  return GKE_LAYERS.filter((l) => l.phase <= currentPhase);
}

/** Validate all pipeline layers export required interface */
export async function validatePipelineWiring() {
  const { LAYER_MODULES } = await import("./layers/index.mjs");
  const missing = [];
  for (const id of PIPELINE_FLOW) {
    const mod = LAYER_MODULES[id];
    if (!mod || typeof mod.getStatus !== "function") {
      missing.push(id);
    }
  }
  return { ok: missing.length === 0, missing, total: PIPELINE_FLOW.length };
}
