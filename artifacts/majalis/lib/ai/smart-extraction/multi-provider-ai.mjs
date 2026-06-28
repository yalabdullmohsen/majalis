/**
 * Multi-Provider AI — OpenAI → Anthropic → Manual Review (vision only when decision engine allows).
 */
import Anthropic from "@anthropic-ai/sdk";
import { getEnvConfig } from "../../env-config.mjs";
import { createAnthropicClient } from "../../api/anthropic-config.mjs";
import { EXTRACTION_PROMPT, normalizeExtractedPayload } from "../../cms/lesson-extractor-shared.mjs";
import { classifyVisionError } from "../vision-provider-fallback.mjs";
import { recordAiUsage } from "./monitoring.mjs";
import { AI_COST_ESTIMATE_USD } from "./field-definitions.mjs";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const OPENAI_VISION_MODEL = "gpt-4o-mini";

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

async function callOpenAiVision({ imageBase64, mimeType, prompt }) {
  const { openaiKey } = getEnvConfig();
  if (!openaiKey) return { ok: false, skip: true, reason: "no_key" };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: "text", text: prompt || EXTRACTION_PROMPT },
        ],
      }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `OpenAI ${res.status}`);
    return { ok: false, error: err.message, classified: classifyVisionError(err) };
  }

  const text = data.choices?.[0]?.message?.content || "";
  const parsed = parseJson(text) || {};
  recordAiUsage({ provider: "openai", type: "vision", costUsd: AI_COST_ESTIMATE_USD.openai_vision });
  return { ok: true, provider: "openai", parsed, rawText: text };
}

async function callAnthropicVision({ imageBase64, mimeType, prompt }) {
  const { anthropicKey } = getEnvConfig();
  if (!anthropicKey) return { ok: false, skip: true, reason: "no_key" };

  try {
    const client = createAnthropicClient(Anthropic, anthropicKey);
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: imageBase64 } },
          { type: "text", text: prompt || EXTRACTION_PROMPT },
        ],
      }],
    });
    const block = response.content?.find((b) => b.type === "text");
    const text = block?.text || "";
    const parsed = parseJson(text) || {};
    recordAiUsage({ provider: "anthropic", type: "vision", costUsd: AI_COST_ESTIMATE_USD.anthropic_vision });
    return { ok: true, provider: "anthropic", parsed, rawText: text };
  } catch (err) {
    return { ok: false, error: err.message, classified: classifyVisionError(err) };
  }
}

async function callOpenAiText({ text, sourceUrl }) {
  const { openaiKey } = getEnvConfig();
  if (!openaiKey) return { ok: false, skip: true };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: `${EXTRACTION_PROMPT}\n\nالمصدر: ${sourceUrl || ""}\n\n${text}` }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data?.error?.message };
  const content = data.choices?.[0]?.message?.content || "";
  recordAiUsage({ provider: "openai", type: "text", costUsd: AI_COST_ESTIMATE_USD.openai_text });
  return { ok: true, provider: "openai", parsed: parseJson(content) || {}, rawText: content };
}

async function callAnthropicText({ text, sourceUrl }) {
  const { anthropicKey } = getEnvConfig();
  if (!anthropicKey) return { ok: false, skip: true };
  try {
    const client = createAnthropicClient(Anthropic, anthropicKey);
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: `${EXTRACTION_PROMPT}\n\nالمصدر: ${sourceUrl || ""}\n\n${text}` }],
    });
    const block = response.content?.find((b) => b.type === "text");
    const content = block?.text || "";
    recordAiUsage({ provider: "anthropic", type: "text", costUsd: AI_COST_ESTIMATE_USD.anthropic_text });
    return { ok: true, provider: "anthropic", parsed: parseJson(content) || {}, rawText: content };
  } catch (err) {
    return { ok: false, error: err.message, classified: classifyVisionError(err) };
  }
}

export async function invokeMultiProviderVision({ imageBase64, mimeType, ocrContext = "" }) {
  const prompt = ocrContext
    ? `${EXTRACTION_PROMPT}\n\nنص OCR المستخرج مسبقاً:\n${ocrContext}`
    : EXTRACTION_PROMPT;

  const chain = [
    { id: "openai", fn: () => callOpenAiVision({ imageBase64, mimeType, prompt }) },
    { id: "anthropic", fn: () => callAnthropicVision({ imageBase64, mimeType, prompt }) },
  ];

  const errors = [];
  for (const step of chain) {
    const result = await step.fn();
    if (result.ok) {
      return {
        ok: true,
        providerUsed: step.id,
        parsed: normalizeExtractedPayload(result.parsed),
        rawText: result.rawText,
        errors,
      };
    }
    if (result.skip) continue;
    errors.push({ provider: step.id, error: result.error, code: result.classified?.code });
  }

  return { ok: false, providerUsed: "manual_review", errors };
}

export async function invokeMultiProviderText({ text, sourceUrl }) {
  const chain = [
    { id: "openai", fn: () => callOpenAiText({ text, sourceUrl }) },
    { id: "anthropic", fn: () => callAnthropicText({ text, sourceUrl }) },
  ];

  const errors = [];
  for (const step of chain) {
    const result = await step.fn();
    if (result.ok) {
      return {
        ok: true,
        providerUsed: step.id,
        parsed: normalizeExtractedPayload(result.parsed),
        rawText: result.rawText,
        errors,
      };
    }
    if (result.skip) continue;
    errors.push({ provider: step.id, error: result.error });
  }

  return { ok: false, providerUsed: "manual_review", errors };
}
