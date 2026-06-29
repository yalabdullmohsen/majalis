/**
 * GKE Event Bus — lightweight event-driven layer communication.
 * In-process only (Phase 1); extensible to queue-backed events later.
 */

const listeners = new Map();

export const GKE_EVENTS = {
  PIPELINE_START: "gke.pipeline.start",
  PIPELINE_STAGE: "gke.pipeline.stage",
  PIPELINE_COMPLETE: "gke.pipeline.complete",
  PIPELINE_ERROR: "gke.pipeline.error",
  SOURCE_SYNC: "gke.source.sync",
  QUALITY_REJECT: "gke.quality.reject",
  REVIEW_ENQUEUE: "gke.review.enqueue",
  CMS_PUBLISH: "gke.cms.publish",
  INDEX_UPDATE: "gke.index.update",
};

/** @param {string} event @param {(payload: unknown) => void | Promise<void>} handler */
export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => off(event, handler);
}

/** @param {string} event @param {(payload: unknown) => void} handler */
export function off(event, handler) {
  listeners.get(event)?.delete(handler);
}

/** @param {string} event @param {unknown} [payload] */
export async function emit(event, payload = {}) {
  const handlers = listeners.get(event);
  if (!handlers?.size) return [];
  const results = [];
  for (const fn of handlers) {
    try {
      results.push(await fn({ event, ...payload, ts: Date.now() }));
    } catch (err) {
      results.push({ error: String(err?.message || err) });
    }
  }
  return results;
}

export function resetEventBus() {
  listeners.clear();
}
