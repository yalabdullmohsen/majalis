/**
 * AKP v3 — AI Quality Engine (rule-based + optional LLM enrichment).
 */
const AR_DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g;

export function scoreContentQuality(record, contentType = "benefits") {
  const errors = [];
  const warnings = [];
  let score = 100;

  const text = extractPrimaryText(record, contentType);
  if (!text || text.trim().length < 10) {
    errors.push("text_too_short");
    score -= 40;
  }

  if (text.length < 30) {
    warnings.push("text_short");
    score -= 10;
  }

  if (!hasArabic(text) && contentType !== "articles") {
    warnings.push("no_arabic");
    score -= 5;
  }

  if (/(.)\1{6,}/.test(text)) {
    warnings.push("repeated_chars");
    score -= 8;
  }

  if (!/[.!?؟،]/.test(text) && text.length > 80) {
    warnings.push("missing_punctuation");
    score -= 5;
  }

  const title = record.title || record.question || "";
  if (["articles", "stories", "rulings", "questions"].includes(contentType) && !title.trim()) {
    errors.push("missing_title");
    score -= 20;
  }

  if (contentType === "questions" && !record.answer?.trim()) {
    errors.push("missing_answer");
    score -= 30;
  }

  if (contentType === "hadith" && !record.source && !record.source_name) {
    warnings.push("missing_source");
    score -= 15;
  }

  const completeness = scoreFieldCompleteness(record, contentType);
  score = Math.round(score * 0.7 + completeness * 0.3);

  return {
    score: Math.max(0, Math.min(100, score)),
    errors,
    warnings,
    completeness,
    normalizedText: normalizeArabicText(text),
  };
}

function extractPrimaryText(record, contentType) {
  switch (contentType) {
    case "benefits":
      return record.text || record.body || record.summary || "";
    case "questions":
      return `${record.question || ""} ${record.answer || ""}`;
    case "hadith":
      return record.text || record.body || "";
    case "stories":
      return record.body || record.summary || record.title || "";
    case "articles":
      return record.description || record.content || record.body || record.title || "";
    case "rulings":
      return record.body || record.summary || record.title || "";
    default:
      return record.text || record.body || record.title || record.description || "";
  }
}

function scoreFieldCompleteness(record, contentType) {
  const required = {
    benefits: ["text"],
    questions: ["question", "answer"],
    hadith: ["text", "source_name"],
    stories: ["title", "body"],
    articles: ["title"],
    rulings: ["title"],
  }[contentType] || ["text"];

  let filled = 0;
  for (const f of required) {
    const v = record[f] ?? record[f.replace("_name", "")];
    if (v != null && String(v).trim()) filled += 1;
  }
  return Math.round((filled / required.length) * 100);
}

function hasArabic(text) {
  return /[\u0600-\u06FF]/.test(String(text || ""));
}

export function normalizeArabicText(text) {
  return String(text || "")
    .replace(AR_DIACRITICS, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function batchQualityCheck(records, contentType) {
  const results = records.map((r) => ({
    record: r,
    quality: scoreContentQuality(r, contentType),
  }));
  const avg =
    results.length > 0
      ? Math.round(results.reduce((a, x) => a + x.quality.score, 0) / results.length)
      : 0;
  return { results, avgScore: avg, rejected: results.filter((r) => r.quality.score < 50).length };
}
