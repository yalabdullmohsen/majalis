/**
 * Parser Engine Layer — delegates to content-pipeline when invoked.
 */
import { layerStatus } from "./_helpers.mjs";
import { GKE_DELEGATES } from "../config.mjs";

const LAYER_ID = "parser_engine";
const LAYER_PHASE = 3;

export function getStatus() {
  return layerStatus(LAYER_ID, "Parser Engine", LAYER_PHASE, 1, GKE_DELEGATES.parser_engine);
}

/** @param {import('../types.mjs').GkePipelineItem} item */
export async function parse(item) {
  try {
    const { stageParse } = await import("../../content-pipeline/stages.mjs");
    const ctx = { item: { raw_title: item.title, raw_body: item.body, content_kind: item.content_kind } };
    const parsed = await stageParse(ctx);
    return { ok: true, layer: LAYER_ID, phase: LAYER_PHASE, data: parsed };
  } catch (err) {
    return { ok: false, layer: LAYER_ID, phase: LAYER_PHASE, message: String(err?.message || err) };
  }
}
