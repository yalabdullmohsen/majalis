/**
 * Vision + OCR + AI enrichment for lesson posters (Arabic).
 * Uses unified fallback: Claude → OpenAI → Local OCR → Manual Review.
 */
import Anthropic from "@anthropic-ai/sdk";
import { validateLessonDraft } from "./content-validator.mjs";
import {
  emptyLessonPayload,
  buildMissingFields,
  normalizeExtractedPayload,
  ENRICH_PROMPT,
  EXTRACTION_PROMPT,
} from "./lesson-extractor-shared.mjs";
import {
  analyzeLessonImageWithFallback,
  hasAnyVisionProvider,
  BILLING_USER_MESSAGE,
} from "../ai/vision-provider-fallback.mjs";

const MODEL = "claude-sonnet-4-6";

export { emptyLessonPayload, buildMissingFields };

export function isVisionEnabled() {
  return hasAnyVisionProvider();
}

function getClient() {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

function parseJson(text) {
  const raw = String(text || "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callText(prompt, data) {
  const client = getClient();
  if (!client) return null;
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: `${prompt}\n\n${JSON.stringify(data, null, 2)}` }],
  });
  const block = response.content?.find((b) => b.type === "text");
  return block?.text || "";
}

function mapFallbackToLegacy(fallbackResult) {
  const parsed = fallbackResult.parsed || emptyLessonPayload();
  const validation = validateLessonDraft(parsed);
  const providerUsed = fallbackResult.providerUsed || "manual_review";
  const visionEnabled = providerUsed !== "manual_review";
  const manualMode = providerUsed === "manual_review" || providerUsed === "ocr";

  return {
    visionEnabled,
    manualReview: manualMode,
    providerUsed,
    message: fallbackResult.userMessage || (manualMode ? BILLING_USER_MESSAGE : undefined),
    extracted: parsed,
    extracted_text: fallbackResult.extractedText || parsed.raw_ocr_text || "",
    parsed_fields: parsed,
    confidence_score: (fallbackResult.confidence ?? Number(parsed.confidence)) || 0,
    aiSuggestions: [],
    validation,
    missing_fields: buildMissingFields(parsed),
    warnings: fallbackResult.warnings || validation.warnings || [],
    errorCode: fallbackResult.errorCode || null,
    userMessage: fallbackResult.userMessage || null,
    fields: fallbackResult.fields || null,
    ok: fallbackResult.ok !== false,
  };
}

export async function extractLessonFromImage({ imageBase64, mimeType = "image/jpeg", sourceUrl, notes }) {
  const fallback = await analyzeLessonImageWithFallback({
    imageBase64,
    mimeType,
    sourceUrl,
    notes,
  });

  if (fallback.providerUsed === "anthropic" || fallback.providerUsed === "openai") {
    try {
      const enrichText = await callText(ENRICH_PROMPT, fallback.parsed);
      const enriched = parseJson(enrichText) || { corrected: fallback.parsed, suggestions: [] };
      fallback.parsed = normalizeExtractedPayload(fallback.parsed, enriched);
      fallback.confidence = Number(fallback.parsed.confidence) || fallback.confidence;
    } catch {
      /* enrichment optional — keep vision result */
    }
  }

  return mapFallbackToLegacy(fallback);
}

export async function extractLessonFromText({ text, sourceUrl }) {
  if (!isVisionEnabled()) {
    const empty = { ...emptyLessonPayload(), description: text?.slice(0, 500) || "" };
    return {
      visionEnabled: false,
      manualReview: true,
      providerUsed: "manual_review",
      message: "الاستخراج التلقائي غير مفعّل. يمكنك إدخال البيانات يدويًا.",
      extracted: empty,
      parsed_fields: empty,
      validation: validateLessonDraft(empty),
      missing_fields: buildMissingFields(empty),
      ok: true,
    };
  }

  try {
    const client = getClient();
    if (!client) throw new Error("no_client");
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\nالمصدر: ${sourceUrl || ""}\n\nالنص:\n${text}`,
        },
      ],
    });
    const block = response.content?.find((b) => b.type === "text");
    const visionText = block?.text || "";
    const extracted = parseJson(visionText) || { title: "", description: text?.slice(0, 500) };
    const enrichText = await callText(ENRICH_PROMPT, extracted);
    const enriched = parseJson(enrichText) || { corrected: extracted, suggestions: [] };
    const merged = normalizeExtractedPayload(extracted, enriched);
    return {
      visionEnabled: true,
      providerUsed: "anthropic",
      extracted: merged,
      parsed_fields: merged,
      aiSuggestions: enriched.suggestions || [],
      validation: validateLessonDraft(merged),
      missing_fields: buildMissingFields(merged),
      ok: true,
    };
  } catch {
    const empty = { ...emptyLessonPayload(), description: text?.slice(0, 500) || "" };
    return {
      visionEnabled: false,
      manualReview: true,
      providerUsed: "manual_review",
      message: BILLING_USER_MESSAGE,
      extracted: empty,
      parsed_fields: empty,
      validation: validateLessonDraft(empty),
      missing_fields: buildMissingFields(empty),
      ok: true,
    };
  }
}
