/**
 * Quality Engine — scores completeness, trust, language, references.
 */
import { layerStatus } from "./_helpers.mjs";
import { GKE_DELEGATES, GKE_QUALITY_THRESHOLD } from "../config.mjs";

const LAYER_ID = "quality_engine";
const LAYER_PHASE = 4;

export function getStatus() {
  return layerStatus(LAYER_ID, "Quality Engine", LAYER_PHASE, 1, GKE_DELEGATES.quality);
}

/** @param {import('../types.mjs').GkePipelineItem} item */
export async function scoreQuality(item) {
  let score = 50;
  if (item.title?.trim()) score += 15;
  if (item.body?.trim()) score += 20;
  if (item.external_key) score += 10;
  if (item.content_kind) score += 5;
  const passed = score >= GKE_QUALITY_THRESHOLD;
  return {
    ok: true,
    layer: LAYER_ID,
    phase: LAYER_PHASE,
    data: { score, passed, threshold: GKE_QUALITY_THRESHOLD, needsReview: !passed },
  };
}
