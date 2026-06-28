/**
 * Lesson extraction — Smart Pipeline only (no direct AI calls).
 * Image → OCR → Rules → Confidence → Decision → AI (if needed) → Validation
 */
import { validateLessonDraft } from "./content-validator.mjs";
import {
  emptyLessonPayload,
  buildMissingFields,
  normalizeExtractedPayload,
} from "./lesson-extractor-shared.mjs";
import { runSmartExtractionPipeline } from "../ai/smart-extraction/pipeline.mjs";
import { getEnvConfig } from "../env-config.mjs";

export { emptyLessonPayload, buildMissingFields };

export function isVisionEnabled() {
  const env = getEnvConfig();
  return Boolean(env.openaiKey || env.anthropicKey);
}

function mapPipelineToLegacy(result) {
  const parsed = result.parsed || emptyLessonPayload();
  const providerUsed = result.providerUsed || "manual_review";
  const visionEnabled = result.usedAi || providerUsed === "rule_engine";

  return {
    visionEnabled,
    manualReview: result.manualReview || providerUsed === "manual_review",
    providerUsed,
    usedAi: result.usedAi,
    pipeline: result.pipeline,
    message: result.userMessage,
    extracted: parsed,
    extracted_text: result.extractedText || parsed.raw_ocr_text || "",
    parsed_fields: parsed,
    confidence_score: result.confidence ?? Number(parsed.confidence) ?? 0,
    confidenceDetail: result.confidenceDetail,
    publishAction: result.publishAction,
    aiSuggestions: [],
    validation: result.validation || validateLessonDraft(parsed),
    missing_fields: result.missing_fields || buildMissingFields(parsed),
    warnings: result.warnings || [],
    errorCode: result.ok ? null : "extraction_degraded",
    userMessage: result.userMessage || null,
    fields: {
      title: parsed.title,
      sheikh: parsed.speaker_name,
      mosque: parsed.mosque,
      date: parsed.gregorian_date,
      time: parsed.lesson_time,
      city: parsed.city,
      registrationUrl: parsed.registration_url,
      phone: parsed.phone,
    },
    ok: result.ok !== false,
    durationMs: result.durationMs,
    ocr: result.ocr,
    decision: result.decision,
  };
}

export async function extractLessonFromImage({ imageBase64, mimeType = "image/jpeg", sourceUrl, notes }) {
  const result = await runSmartExtractionPipeline({
    imageBase64,
    mimeType,
    sourceUrl,
    notes,
  });
  return mapPipelineToLegacy(result);
}

export async function extractLessonFromText({ text, sourceUrl }) {
  const result = await runSmartExtractionPipeline({
    textOnly: text,
    sourceUrl,
  });
  return mapPipelineToLegacy(result);
}
