/**
 * Review Queue — items below quality threshold never auto-publish.
 */
import { layerStatus } from "./_helpers.mjs";
import { GKE_DELEGATES } from "../config.mjs";
import { emit, GKE_EVENTS } from "../events.mjs";

const LAYER_ID = "review_queue";
const LAYER_PHASE = 4;

export function getStatus() {
  return layerStatus(LAYER_ID, "Review Queue", LAYER_PHASE, 1, GKE_DELEGATES.review_queue);
}

/** @param {import('../types.mjs').GkePipelineItem} item @param {string} reason */
export async function enqueue(item, reason = "quality_below_threshold") {
  await emit(GKE_EVENTS.REVIEW_ENQUEUE, { item, reason });
  return { ok: true, layer: LAYER_ID, phase: LAYER_PHASE, data: { queued: true, reason, status: "pending_review" } };
}
