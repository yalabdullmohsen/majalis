/**
 * AI Classification Engine — extraction/classification only (no fabrication).
 */
import { layerStatus } from "./_helpers.mjs";
import { GKE_DELEGATES } from "../config.mjs";

const LAYER_ID = "ai_classification_engine";
const LAYER_PHASE = 4;

export function getStatus() {
  return layerStatus(LAYER_ID, "AI Classification Engine", LAYER_PHASE, 1, GKE_DELEGATES.ai_classification);
}

/** @param {Array<Record<string, unknown>>} items */
export async function classify(items) {
  if (!items?.length) return { ok: true, layer: LAYER_ID, phase: LAYER_PHASE, data: [] };
  try {
    const { analyzeBatch } = await import("../../knowledge-engine/ai-analyzer.mjs");
    const analyzed = await analyzeBatch(items.slice(0, 5), { dryRun: true });
    return { ok: true, layer: LAYER_ID, phase: LAYER_PHASE, data: analyzed, dryRun: true };
  } catch (err) {
    return { ok: false, layer: LAYER_ID, phase: LAYER_PHASE, message: String(err?.message || err) };
  }
}
