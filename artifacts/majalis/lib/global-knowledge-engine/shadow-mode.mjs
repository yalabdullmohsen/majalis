/**
 * GKE Shadow Mode — fetch/analyze/classify/verify without auto-publish.
 */
import { GKE_SHADOW_MODE } from "./config.mjs";
import { emit, GKE_EVENTS } from "./events.mjs";
import * as parserEngine from "./layers/parser-engine.mjs";
import * as normalizationEngine from "./layers/normalization-engine.mjs";
import * as qualityEngine from "./layers/quality-engine.mjs";
import * as deduplicationEngine from "./layers/deduplication-engine.mjs";
import * as reviewQueue from "./layers/review-queue.mjs";

export function isShadowMode() {
  return GKE_SHADOW_MODE !== false;
}

export function getShadowModeConfig() {
  return {
    enabled: isShadowMode(),
    auto_publish: false,
    review_queue: true,
    description: "جلب وتحليل وتصنيف دون نشر تلقائي",
  };
}

/**
 * Process item in shadow mode — never publishes to CMS.
 * @param {object} item
 * @param {{ source_id?: string, existingKeys?: string[] }} ctx
 */
export async function processShadowItem(item, ctx = {}) {
  const start = Date.now();
  await emit(GKE_EVENTS.PIPELINE_START, { mode: "shadow", item });

  const parsed = await parserEngine.parse(item);
  const normalized = await normalizationEngine.normalize({ ...item, ...parsed.data });
  const quality = await qualityEngine.scoreQuality(item);
  const dedup = await deduplicationEngine.deduplicate(
    item,
    (ctx.existingKeys || []).map((k) => ({ external_key: k })),
  );

  const isDuplicate = dedup.data?.isDuplicate === true;
  let status = "pending_review";
  if (isDuplicate) status = "duplicate";
  else if (!quality.data?.passed) status = "rejected";

  if (!isDuplicate && quality.data?.passed) {
    await reviewQueue.enqueue(item, "shadow_mode_review");
  }

  const result = {
    ok: true,
    mode: "shadow",
    published: false,
    status,
    quality_score: quality.data?.score,
    is_duplicate: isDuplicate,
    processing_ms: Date.now() - start,
    item: {
      external_key: item.external_key,
      title: item.title,
      content_kind: item.content_kind,
      source_id: ctx.source_id,
    },
  };

  await emit(GKE_EVENTS.PIPELINE_COMPLETE, { mode: "shadow", result });
  return result;
}

/** Block any publish attempt while shadow mode is on. */
export function assertNotPublishing(action = "publish") {
  if (isShadowMode()) {
    const err = new Error(`GKE_SHADOW_MODE: ${action} blocked`);
    err.code = "GKE_SHADOW_MODE";
    throw err;
  }
}
