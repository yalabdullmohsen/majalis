/**
 * Default pipeline stage implementations — composable with runner.mjs
 */

import { normalizeContentKind } from "../auto-knowledge-engine/content-kind.mjs";
import { sanitizeProductionRecord } from "../production/content-sanitizer.mjs";
import { computeConfidenceScore } from "../production/confidence-engine.mjs";
import { buildFusionKey } from "../production/source-fusion.mjs";

export async function stageParse(ctx) {
  const item = ctx.item;
  return {
    raw_title: item.raw_title || item.title || "",
    raw_body: item.raw_body || item.description || item.text || "",
    content_kind: normalizeContentKind(item.content_kind || "announcement"),
  };
}

export async function stageNormalize(ctx) {
  const item = ctx.item;
  const payload = item.raw_payload || {};
  return {
    extracted_fields: {
      title: payload.title || item.raw_title,
      speaker_name: payload.speaker_name || payload.sheikh_name,
      mosque: payload.mosque || payload.location,
      city: payload.city || "الكويت",
      lesson_time: payload.lesson_time || payload.time,
      start_date: payload.start_date || payload.date,
      ...(item.extracted_fields || {}),
    },
  };
}

export async function stageClassify(ctx) {
  const text = `${ctx.item.raw_title || ""} ${ctx.item.raw_body || ""}`;
  const kind = /دورة|course|workshop/i.test(text)
    ? "course"
    : /درس|lesson|محاضرة/i.test(text)
      ? "lesson"
      : ctx.item.content_kind || "announcement";
  return { content_kind: normalizeContentKind(kind) };
}

export async function stageSanitize(ctx) {
  const check = sanitizeProductionRecord({
    title: ctx.item.raw_title,
    text: ctx.item.raw_body,
    description: ctx.item.raw_body,
    external_id: ctx.item.external_id,
  });
  if (!check.ok) {
    const err = new Error(check.reason);
    err.code = "CONTENT_BLOCKED";
    throw err;
  }
  return {};
}

export async function stageConfidence(ctx) {
  const ef = ctx.item.extracted_fields || {};
  const result = computeConfidenceScore({
    baseScore: ctx.item.ai_confidence ?? 65,
    sourceType: ctx.item.source_type || ctx.meta?.connectorType,
    sheikhMatch: Boolean(ef.speaker_name),
    mosqueMatch: Boolean(ef.mosque),
    cityMatch: Boolean(ef.city),
    dateMatch: Boolean(ef.start_date),
    metadataComplete: Boolean(ef.title && ef.speaker_name && ef.mosque),
    missingRequiredFields: [
      !ef.title && "title",
      !ef.speaker_name && "speaker",
      !ef.mosque && "mosque",
    ].filter(Boolean),
  });
  return { confidence: result, publish_action: result.action };
}

export async function stageFusionKey(ctx) {
  const key = buildFusionKey({
    title: ctx.item.raw_title,
    speaker_name: ctx.item.extracted_fields?.speaker_name,
    mosque: ctx.item.extracted_fields?.mosque,
    start_date: ctx.item.extracted_fields?.start_date,
    lesson_time: ctx.item.extracted_fields?.lesson_time,
    city: ctx.item.extracted_fields?.city,
  });
  return { fusion_key: key };
}

export async function stageVision(ctx) {
  const imageUrl = ctx.item.raw_payload?.imageUrl || ctx.item.raw_payload?.media_url;
  if (!imageUrl) return {};
  try {
    const { extractStructuredFields } = await import("../auto-knowledge-engine/v2/extraction-service.mjs");
    const result = await extractStructuredFields(ctx.item, ctx.meta?.connectorConfig || {});
    return {
      extracted_fields: {
        ...(ctx.item.extracted_fields || {}),
        ...(result.extracted_fields || {}),
      },
      ai_confidence: result.extracted_fields?.confidence,
    };
  } catch {
    return {};
  }
}

export const DEFAULT_LESSON_STAGES = [
  { name: "parse", fn: stageParse },
  { name: "normalize", fn: stageNormalize },
  { name: "classify", fn: stageClassify },
  { name: "vision", fn: stageVision },
  { name: "sanitize", fn: stageSanitize, required: true },
  { name: "fusion_key", fn: stageFusionKey },
  { name: "confidence", fn: stageConfidence },
];
