/**
 * Normalization Engine Layer — standardizes fields before AI/quality.
 */
import { layerStatus } from "./_helpers.mjs";
import { GKE_DELEGATES } from "../config.mjs";

const LAYER_ID = "normalization_engine";
const LAYER_PHASE = 3;

export function getStatus() {
  return layerStatus(LAYER_ID, "Normalization Engine", LAYER_PHASE, 1, GKE_DELEGATES.parser_engine);
}

/** @param {import('../types.mjs').GkePipelineItem} item */
export async function normalize(item) {
  try {
    const { stageNormalize } = await import("../../content-pipeline/stages.mjs");
    const ctx = { item: { raw_title: item.title, raw_body: item.body, extracted_fields: item.metadata || {} } };
    const out = await stageNormalize(ctx);
    return { ok: true, layer: LAYER_ID, phase: LAYER_PHASE, data: out };
  } catch (err) {
    return { ok: false, layer: LAYER_ID, phase: LAYER_PHASE, message: String(err?.message || err) };
  }
}
