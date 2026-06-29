/**
 * Source Registry Layer — Phase 2 (architecture stub in Phase 1).
 * Will unify: ake_connectors, lesson_sources, mke_source_plugins, akp_content_sources.
 */
import { layerStatus } from "./_helpers.mjs";
import { GKE_DELEGATES } from "../config.mjs";

const LAYER_ID = "source_registry";
const LAYER_PHASE = 2;

export function getStatus() {
  return layerStatus(LAYER_ID, "Source Registry", LAYER_PHASE, 1, GKE_DELEGATES.source_registry);
}

/** @param {import('../types.mjs').GkeSourceRecord[]} _sources */
export async function registerSources(_sources) {
  return { ok: false, layer: LAYER_ID, phase: LAYER_PHASE, message: "Phase 2 — use MKE/AKE registries until unified" };
}

export async function listSources() {
  return { ok: true, layer: LAYER_ID, phase: LAYER_PHASE, data: [], count: 0, message: "Phase 2 pending" };
}
