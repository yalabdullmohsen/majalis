/**
 * Unified vision fallback for lesson poster analysis.
 * Claude Vision → OpenAI Vision → Local OCR → Manual Review
 */
import Anthropic from "@anthropic-ai/sdk";
import { getEnvConfig } from "../env-config.mjs";
import { createAnthropicClient } from "../api/anthropic-config.mjs";
import {
  emptyLessonPayload,
  buildMissingFields,
  normalizeExtractedPayload,
  EXTRACTION_PROMPT,
} from "../cms/lesson-extractor-shared.mjs";
import { runLocalOcr } from "./local-ocr.mjs";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const OPENAI_VISION_MODEL = "gpt-4o-mini";

const BILLING_USER_MESSAGE =
  "تعذر التحليل التلقائي حالياً بسبب عدم توفر رصيد خدمة الذكاء الاصطناعي. تم حفظ الصورة ويمكنك إدخال البيانات يدوياً أو إعادة المحاولة لاحقاً.";

const MANUAL_REVIEW_MESSAGE =
  "تعذر الاستخراج التلقائي. تم حفظ الصورة للمراجعة — يمكنك إدخال البيانات يدوياً.";

const RUNTIME = {
  lastSuccess: null,
  lastError: null,
  lastProvider: null,
  anthropicBillingDegraded: false,
};

function pickEnv(...keys) {
  for (const k of keys) {
    const v = String(process.env[k] || "").trim();
    if (v) return v;
  }
  return "";
}

export function isFallbackEnabled() {
  const v = pickEnv("VISION_FALLBACK_ENABLED");
  return v === "" || v === "1" || v.toLowerCase() === "true";
}

export function getPrimaryVisionProvider() {
  const configured = pickEnv("VISION_PRIMARY_PROVIDER").toLowerCase();
  if (configured === "openai" || configured === "anthropic") return configured;
  if (pickEnv("ANTHROPIC_API_KEY")) return "anthropic";
  if (pickEnv("OPENAI_API_KEY")) return "openai";
  return "none";
}

export function hasAnyVisionProvider() {
  return Boolean(pickEnv("ANTHROPIC_API_KEY") || pickEnv("OPENAI_API_KEY"));
}

export function classifyVisionError(err) {
  const msg = String(err?.message || err?.error?.message || err || "").toLowerCase();
  const type = String(err?.type || err?.error?.type || "").toLowerCase();
  const status = Number(err?.status || err?.statusCode || err?.error?.status || 0);

  if (
    msg.includes("credit balance is too low") ||
    msg.includes("insufficient credit") ||
    msg.includes("insufficient_credit") ||
    msg.includes("billing") ||
    msg.includes("payment") ||
    msg.includes("purchase credits")
  ) {
    return { code: "insufficient_credit", retryable: true, billing: true };
  }
  if (msg.includes("rate limit") || msg.includes("rate_limit") || status === 429) {
    return { code: "rate_limited", retryable: true, billing: false };
  }
  if (
    msg.includes("authentication") ||
    msg.includes("invalid api key") ||
    msg.includes("invalid x-api-key") ||
    msg.includes("unauthorized") ||
    status === 401 ||
    status === 403
  ) {
    return { code: "auth_failed", retryable: false, billing: false };
  }
  if (type.includes("overloaded") || status === 529) {
    return { code: "provider_overloaded", retryable: true, billing: false };
  }
  return { code: "vision_failed", retryable: true, billing: false };
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

function mapFields(parsed = {}, notes = "") {
  return {
    title: parsed.title || "",
    sheikh: parsed.speaker_name || parsed.sheikh || "",
    mosque: parsed.mosque || "",
    date: parsed.gregorian_date || parsed.start_date || "",
    time: parsed.lesson_time || "",
    city: parsed.city || "",
    registrationUrl: parsed.registration_url || "",
    phone: parsed.phone || "",
    notes: notes || parsed.description || "",
  };
}

function buildResult({
  ok,
  providerUsed,
  parsed,
  confidence,
  warnings = [],
  errorCode,
  userMessage,
  extractedText = "",
}) {
  const fields = mapFields(parsed, parsed?.description || "");
  const result = {
    ok,
    providerUsed,
    fields,
    confidence: confidence ?? 0,
    warnings,
    errorCode: errorCode || null,
    userMessage: userMessage || null,
    parsed,
    extractedText,
  };

  if (ok && providerUsed !== "manual_review") {
    RUNTIME.lastSuccess = { at: new Date().toISOString(), provider: providerUsed };
    RUNTIME.lastProvider = providerUsed;
    if (providerUsed === "anthropic") RUNTIME.anthropicBillingDegraded = false;
  } else if (errorCode) {
    RUNTIME.lastError = {
      at: new Date().toISOString(),
      code: errorCode,
      provider: providerUsed,
      message: userMessage || errorCode,
    };
  }

  if (errorCode === "insufficient_credit") {
    RUNTIME.anthropicBillingDegraded = true;
  }

  return result;
}

async function callClaudeVision({ imageBase64, mimeType, notes, sourceUrl }) {
  const { anthropicKey } = getEnvConfig();
  if (!anthropicKey) return { ok: false, skip: true, reason: "no_key" };

  const client = createAnthropicClient(Anthropic, anthropicKey);
  const prompt = `${EXTRACTION_PROMPT}\n\nالمصدر: ${sourceUrl || "—"}\nملاحظات: ${notes || "—"}`;

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType || "image/jpeg", data: imageBase64 },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const block = response.content?.find((b) => b.type === "text");
  const text = block?.text || "";
  const extracted = parseJson(text) || { raw_ocr_text: text, title: "" };
  const merged = normalizeExtractedPayload(extracted);
  return {
    ok: true,
    parsed: merged,
    extractedText: merged.raw_ocr_text || text,
    confidence: Number(merged.confidence) || 0.75,
  };
}

async function callOpenAiVision({ imageBase64, mimeType, notes, sourceUrl }) {
  const { openaiKey } = getEnvConfig();
  if (!openaiKey) return { ok: false, skip: true, reason: "no_key" };

  const prompt = `${EXTRACTION_PROMPT}\n\nالمصدر: ${sourceUrl || "—"}\nملاحظات: ${notes || "—"}`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      max_tokens: 4096,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` },
            },
          ],
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `OpenAI ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const text = data.choices?.[0]?.message?.content || "";
  const extracted = parseJson(text) || { raw_ocr_text: text, title: "" };
  const merged = normalizeExtractedPayload(extracted);
  return {
    ok: true,
    parsed: merged,
    extractedText: merged.raw_ocr_text || text,
    confidence: Number(merged.confidence) || 0.65,
  };
}

function manualReviewResult({ notes, sourceUrl, errorCode, userMessage, warnings = [] }) {
  const parsed = {
    ...emptyLessonPayload(),
    description: notes || "",
    source_url: sourceUrl || "",
  };
  return buildResult({
    ok: true,
    providerUsed: "manual_review",
    parsed,
    confidence: 0,
    warnings,
    errorCode,
    userMessage,
    extractedText: notes || "",
  });
}

export async function analyzeLessonImageWithFallback(opts = {}) {
  const mimeType = opts.mimeType || "image/jpeg";
  const sourceUrl = opts.sourceUrl || "";
  const notes = opts.notes || "";
  const imageBase64 = opts.imageBase64 || (opts.image ? opts.image.toString("base64") : null);

  if (!imageBase64) {
    return manualReviewResult({
      notes,
      sourceUrl,
      errorCode: "missing_image",
      userMessage: "لم تُرفع صورة. يمكنك إدخال البيانات يدوياً.",
      warnings: [{ field: "image", message: "صورة مفقودة" }],
    });
  }

  const primary = getPrimaryVisionProvider();
  const fallback = isFallbackEnabled();
  const chain =
    primary === "openai"
      ? [
          { id: "openai", fn: callOpenAiVision },
          { id: "anthropic", fn: callClaudeVision },
        ]
      : [
          { id: "anthropic", fn: callClaudeVision },
          { id: "openai", fn: callOpenAiVision },
        ];

  const errors = [];
  let billingFailure = false;

  for (const step of chain) {
    try {
      const result = await step.fn({ imageBase64, mimeType, notes, sourceUrl });
      if (result.skip) continue;
      if (result.ok && result.parsed) {
        return buildResult({
          ok: true,
          providerUsed: step.id === "anthropic" ? "anthropic" : "openai",
          parsed: result.parsed,
          confidence: result.confidence,
          extractedText: result.extractedText,
          warnings: buildMissingFields(result.parsed).map((f) => ({
            field: f,
            message: `حقل ناقص: ${f}`,
          })),
        });
      }
    } catch (err) {
      const classified = classifyVisionError(err);
      errors.push({ provider: step.id, ...classified });
      if (classified.billing && step.id === "anthropic") billingFailure = true;
      if (!fallback) break;
    }
  }

  if (fallback) {
    try {
      const ocr = await runLocalOcr({ imageBase64, mimeType, notes, sourceUrl });
      if (ocr?.ok && ocr.parsed) {
        const merged = normalizeExtractedPayload(ocr.parsed);
        const hasContent = Boolean(merged.title || merged.speaker_name || merged.mosque || merged.raw_ocr_text);
        if (hasContent) {
          return buildResult({
            ok: true,
            providerUsed: "ocr",
            parsed: merged,
            confidence: ocr.confidence ?? 0.35,
            extractedText: ocr.text || merged.raw_ocr_text || "",
            warnings: [{ field: "ocr", message: "استخراج محدود — راجع البيانات يدوياً" }],
            userMessage: billingFailure ? BILLING_USER_MESSAGE : undefined,
          });
        }
      }
    } catch {
      /* manual review */
    }
  }

  const userMessage = billingFailure
    ? BILLING_USER_MESSAGE
    : errors.some((e) => e.code === "rate_limited")
      ? "تعذر التحليل بسبب ضغط على الخدمة. تم حفظ الصورة — أعد المحاولة لاحقاً أو أدخل البيانات يدوياً."
      : MANUAL_REVIEW_MESSAGE;

  return manualReviewResult({
    notes,
    sourceUrl,
    errorCode: billingFailure ? "insufficient_credit" : errors[0]?.code || "all_providers_failed",
    userMessage,
    warnings: [
      ...(billingFailure ? [{ field: "billing", message: BILLING_USER_MESSAGE }] : []),
      { field: "manual", message: "يُنصح بإدخال البيانات يدوياً أو إرسال للمراجعة" },
    ],
  });
}

export function getVisionRuntimeStatus() {
  const { anthropicKey, openaiKey } = getEnvConfig();
  return {
    status: RUNTIME.anthropicBillingDegraded ? "degraded" : hasAnyVisionProvider() ? "ready" : "manual_only",
    primaryProvider: getPrimaryVisionProvider(),
    fallbackEnabled: isFallbackEnabled(),
    anthropicConfigured: Boolean(anthropicKey),
    openaiConfigured: Boolean(openaiKey),
    anthropicBillingDegraded: RUNTIME.anthropicBillingDegraded,
    lastSuccess: RUNTIME.lastSuccess,
    lastError: RUNTIME.lastError,
    lastProvider: RUNTIME.lastProvider,
  };
}

export function getVisionAiStatus() {
  const runtime = getVisionRuntimeStatus();
  const fallbackProvider =
    runtime.primaryProvider === "anthropic"
      ? runtime.openaiConfigured
        ? "openai"
        : "ocr"
      : runtime.anthropicConfigured
        ? "anthropic"
        : "ocr";

  return {
    ok: true,
    systemStatus: runtime.anthropicBillingDegraded || runtime.status === "manual_only" ? "degraded" : "healthy",
    anthropic: {
      configured: runtime.anthropicConfigured,
      billingDegraded: runtime.anthropicBillingDegraded,
      status: runtime.anthropicBillingDegraded ? "insufficient_credit" : runtime.anthropicConfigured ? "ready" : "not_configured",
    },
    openai: {
      configured: runtime.openaiConfigured,
      status: runtime.openaiConfigured ? "ready" : "not_configured",
    },
    primaryProvider: runtime.primaryProvider,
    fallbackProvider,
    fallbackEnabled: runtime.fallbackEnabled,
    lastSuccess: runtime.lastSuccess,
    lastError: runtime.lastError,
    lastProvider: runtime.lastProvider,
    userMessages: {
      insufficient_credit: BILLING_USER_MESSAGE,
      manual_review: MANUAL_REVIEW_MESSAGE,
    },
  };
}

export { BILLING_USER_MESSAGE, MANUAL_REVIEW_MESSAGE };
