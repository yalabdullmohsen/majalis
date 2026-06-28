/**
 * AI Analyzer — extracts metadata ONLY from official source text.
 * NEVER generates hadith, fatwas, rulings, or scholar attributions.
 */

import { ASSISTANT_MODEL } from "../api/anthropic-config.mjs";
import { FORBIDDEN_AI_GENERATION } from "./sources-registry.mjs";

const ANALYSIS_SYSTEM = `أنت محلل محتوى علمي شرعي في منصة "المجلس العلمي".
مهمتك: استخراج بيانات وصفية من نص المصدر الرسمي فقط.

ممنوع منعاً باتاً:
- inventing or generating hadith text
- inventing fatwas or legal rulings
- inventing consensus (ijma) claims
- attributing quotes to scholars not present in the source
- creating religious decisions

مسموح فقط:
- extract title from source
- summarize source content professionally (short, factual)
- extract keywords present in source
- classify topic (عقيدة، تفسير، حديث، فقه، سيرة، etc.)
- detect country/region if mentioned
- detect scholar name ONLY if explicitly in source text
- detect language
- list verse references (surah:ayah) if present — reference only
- list hadith references (book/chapter) if present — reference only, NO hadith text
- generate SEO title/description based on source summary
- suggest structured data fields

Respond ONLY with valid JSON matching this schema:
{
  "title": "string",
  "summary": "string (max 400 chars)",
  "keywords": ["string"],
  "category": "string",
  "country": "string or null",
  "scholar": "string or null (only if in source)",
  "language": "ar|en|other",
  "topic": "string",
  "verse_refs": [{"surah":"string","ayah":"string"}],
  "hadith_refs": [{"source":"string","reference":"string"}],
  "seo_title": "string (max 70 chars)",
  "seo_description": "string (max 160 chars)",
  "confidence": 0-100,
  "needs_human_review": boolean,
  "review_reason": "string or null"
}`;

export async function analyzeContent(rawTitle, rawBody, context = {}) {
  const apiKey = String(process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) {
    return fallbackAnalysis(rawTitle, rawBody, context);
  }

  const userContent = [
    `المصدر: ${context.source_name || "غير محدد"}`,
    `الرابط: ${context.source_url || "—"}`,
    `نوع المحتوى: ${context.content_kind || "article"}`,
    "",
    `العنوان الأصلي: ${rawTitle || ""}`,
    "",
    `النص:`,
    String(rawBody || "").slice(0, 4000),
  ].join("\n");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ASSISTANT_MODEL,
        max_tokens: 1200,
        system: ANALYSIS_SYSTEM,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) return fallbackAnalysis(rawTitle, rawBody, context);

    const data = await response.json();
    const text = data?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackAnalysis(rawTitle, rawBody, context);

    const parsed = JSON.parse(jsonMatch[0]);
    return sanitizeAnalysis(parsed, rawTitle, rawBody);
  } catch (err) {
    console.warn("[knowledge-ai-analyzer] fallback:", err.message);
    return fallbackAnalysis(rawTitle, rawBody, context);
  }
}

function sanitizeAnalysis(parsed, rawTitle, rawBody) {
  const text = `${rawTitle} ${rawBody}`.toLowerCase();
  const hasForbidden = FORBIDDEN_AI_GENERATION.some((f) =>
    parsed.summary?.includes(f) || parsed.review_reason?.includes(f),
  );

  const scholar = parsed.scholar && text.includes(String(parsed.scholar).toLowerCase().slice(0, 8))
    ? parsed.scholar
    : null;

  return {
    ai_title: String(parsed.title || rawTitle || "").slice(0, 300),
    ai_summary: String(parsed.summary || rawBody || "").slice(0, 600),
    ai_keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 15).map(String) : extractKeywords(rawTitle, rawBody),
    ai_category: String(parsed.category || "عام").slice(0, 80),
    ai_country: parsed.country ? String(parsed.country).slice(0, 60) : null,
    ai_scholar: scholar ? String(scholar).slice(0, 120) : null,
    ai_language: ["ar", "en"].includes(parsed.language) ? parsed.language : "ar",
    ai_topic: String(parsed.topic || parsed.category || "عام").slice(0, 80),
    ai_verse_refs: Array.isArray(parsed.verse_refs) ? parsed.verse_refs.slice(0, 5) : [],
    ai_hadith_refs: Array.isArray(parsed.hadith_refs) ? parsed.hadith_refs.slice(0, 5) : [],
    seo_title: String(parsed.seo_title || parsed.title || rawTitle || "").slice(0, 70),
    seo_description: String(parsed.seo_description || parsed.summary || "").slice(0, 160),
    ai_confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 60)),
    needs_human_review: Boolean(parsed.needs_human_review) || hasForbidden || !parsed.summary,
    review_reason: parsed.review_reason || (hasForbidden ? "محتوى يحتاج مراجعة بشرية" : null),
  };
}

function fallbackAnalysis(rawTitle, rawBody, context) {
  const summary = String(rawBody || rawTitle || "").slice(0, 400);
  const hasStructuredBody = String(rawBody || "").trim().length >= 20;
  const trustScore = Number(context.trust_score || 0);
  const isOfficialManifest = context.source_type === "manifest" || trustScore >= 80;

  return {
    ai_title: String(rawTitle || "بدون عنوان").slice(0, 300),
    ai_summary: summary,
    ai_keywords: extractKeywords(rawTitle, rawBody),
    ai_category: mapKindToCategory(context.content_kind),
    ai_country: context.country || null,
    ai_scholar: null,
    ai_language: "ar",
    ai_topic: mapKindToCategory(context.content_kind),
    ai_verse_refs: [],
    ai_hadith_refs: [],
    seo_title: String(rawTitle || "").slice(0, 70),
    seo_description: summary.slice(0, 160),
    ai_confidence: hasStructuredBody && isOfficialManifest ? 62 : 45,
    needs_human_review: !(hasStructuredBody && isOfficialManifest),
    review_reason: hasStructuredBody && isOfficialManifest
      ? null
      : "تحليل بدون ذكاء اصطناعي — يحتاج مراجعة",
  };
}

function extractKeywords(title, body) {
  const text = `${title} ${body}`;
  const words = text
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 20);
  return [...new Set(words)].slice(0, 10);
}

function mapKindToCategory(kind) {
  const map = {
    lesson: "طلب العلم",
    lecture: "طلب العلم",
    course: "طلب العلم",
    fawaid: "فوائد",
    book: "كتب",
    article: "مقالات",
    news: "أخبار",
    miracle: "إعجاز علمي",
    qa: "أسئلة وأجوبة",
    fiqh_decision: "فقه",
    fatwa: "فتاوى",
    sheikh: "علماء",
  };
  return map[kind] || "عام";
}

export async function analyzeBatch(items, concurrency = 3) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const analyzed = await Promise.all(
      batch.map(async (item) => ({
        ...item,
        analysis: await analyzeContent(item.raw_title, item.raw_body, {
          source_name: item.source_attribution,
          source_url: item.raw_url,
          content_kind: item.content_kind,
          country: item.ai_country,
          source_type: item.raw_payload?._manifest_file ? "manifest" : undefined,
          trust_score: item.verification?.trustScore,
        }),
      })),
    );
    results.push(...analyzed);
  }
  return results;
}
