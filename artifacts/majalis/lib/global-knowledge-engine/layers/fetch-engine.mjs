/**
 * Fetch Engine Layer — Phase 3 (architecture stub).
 * Delegates to AKE connectors when active.
 */
import { layerStatus } from "./_helpers.mjs";
import { GKE_DELEGATES, GKE_FETCH_TYPES } from "../config.mjs";

const LAYER_ID = "fetch_engine";
const LAYER_PHASE = 3;

export function getStatus() {
  return layerStatus(LAYER_ID, "Fetch Engine", LAYER_PHASE, 1, GKE_DELEGATES.fetch_engine);
}

export function supportedTypes() {
  return GKE_FETCH_TYPES;
}

/** @param {{ source_type?: string, url?: string }} _opts */
export async function fetch(_opts) {
  return { ok: false, layer: LAYER_ID, phase: LAYER_PHASE, message: "Phase 3 — delegate to AKE connectors" };
}
