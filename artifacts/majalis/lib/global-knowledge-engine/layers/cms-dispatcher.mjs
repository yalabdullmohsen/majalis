/**
 * Smart CMS Dispatcher — routes accepted content to correct section only.
 */
import { layerStatus } from "./_helpers.mjs";
import { GKE_CMS_KINDS, GKE_DELEGATES } from "../config.mjs";
import { emit, GKE_EVENTS } from "../events.mjs";

const LAYER_ID = "cms_dispatcher";
const LAYER_PHASE = 6;

export function getStatus() {
  return layerStatus(LAYER_ID, "Smart CMS", LAYER_PHASE, 1, GKE_DELEGATES.cms_dispatcher);
}

/** @param {import('../types.mjs').GkePipelineItem} item */
export async function dispatch(item) {
  const { isShadowMode } = await import("../shadow-mode.mjs");
  if (isShadowMode()) {
    return {
      ok: true,
      layer: LAYER_ID,
      phase: LAYER_PHASE,
      data: { kind: item.content_kind, routed: false, published: false, shadow_mode: true },
    };
  }
  const kind = String(item.content_kind || "").toLowerCase();
  if (!GKE_CMS_KINDS.includes(kind)) {
    return { ok: false, layer: LAYER_ID, phase: LAYER_PHASE, message: `Invalid CMS kind: ${kind}` };
  }
  await emit(GKE_EVENTS.CMS_PUBLISH, { item, kind });
  return { ok: true, layer: LAYER_ID, phase: LAYER_PHASE, data: { kind, routed: true, autoPublish: false } };
}

export function allowedKinds() {
  return GKE_CMS_KINDS;
}
