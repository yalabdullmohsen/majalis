/**
 * Content Pipeline Runner — isolated stages; one failure does not stop the pipeline.
 *
 * Source → Fetcher → Parser → Normalizer → Dedup → Classifier → Vision/OCR →
 * Metadata → Lesson Intelligence → AI Verify → Confidence → Review → Publisher →
 * Search → SEO → Analytics → Monitoring → Archive
 */

import { akeLog } from "../auto-knowledge-engine/monitoring.mjs";

/**
 * @typedef {object} PipelineContext
 * @property {string} runId
 * @property {object} item
 * @property {object} meta
 * @property {object[]} stageResults
 */

/**
 * @param {string} name
 * @param {(ctx: PipelineContext) => Promise<object>} fn
 * @param {PipelineContext} ctx
 */
async function runStage(name, fn, ctx) {
  const started = Date.now();
  try {
    const patch = await fn(ctx);
    const result = { stage: name, ok: true, durationMs: Date.now() - started, patch: patch || {} };
    ctx.stageResults.push(result);
    if (patch && typeof patch === "object") {
      ctx.item = { ...ctx.item, ...patch };
      if (patch.meta) ctx.meta = { ...ctx.meta, ...patch.meta };
    }
    return result;
  } catch (err) {
    const result = {
      stage: name,
      ok: false,
      durationMs: Date.now() - started,
      error: String(err.message || err),
      code: err.code || "STAGE_FAILED",
    };
    ctx.stageResults.push(result);
    await akeLog("pipeline_stage_failed", "warn", name, { metadata: { runId: ctx.runId, error: result.error } });
    return result;
  }
}

/**
 * @param {object} item
 * @param {Array<{ name: string, fn: Function, required?: boolean }>} stages
 * @param {object} [options]
 */
export async function runContentPipeline(item, stages, options = {}) {
  const ctx = {
    runId: options.runId || `pipe-${Date.now()}`,
    item: { ...item },
    meta: { ...(options.meta || {}) },
    stageResults: [],
  };

  for (const stage of stages) {
    const result = await runStage(stage.name, stage.fn, ctx);
    if (!result.ok && stage.required) {
      return { ok: false, abortedAt: stage.name, ctx };
    }
  }

  return { ok: true, item: ctx.item, meta: ctx.meta, stages: ctx.stageResults };
}

export { runStage };
