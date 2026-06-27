/**
 * Validation gates — source, metadata, duplicate, quality, language, formatting.
 */
import { PIPELINES, VALIDATION_STAGES } from "./config.mjs";
import { normalizeArabicText } from "./normalize.mjs";

const ARABIC_RATIO_MIN = 0.55;
const MIN_BODY_LENGTH = 12;
const MIN_QUALITY_SCORE = 60;

function arabicRatio(text) {
  const s = String(text || "");
  if (!s.length) return 0;
  const arabic = (s.match(/[\u0600-\u06FF]/g) || []).length;
  return arabic / s.length;
}

function hasPlaceholder(text) {
  const lower = String(text || "").toLowerCase();
  const flags = ["placeholder", "demo", "test", "sample", "mock", "lorem", "تجريبي", "example", "phase"];
  return flags.some((f) => lower.includes(f));
}

export function validateContentItem(item, pipelineId) {
  const pipeline = PIPELINES[pipelineId];
  const errors = [];
  const stages = {};

  // Source validation
  const sourceUrl = item.source_url || item.metadata?.source_url;
  const sourceName = item.source_name || item.metadata?.source_name;
  stages.source = { passed: true, errors: [] };
  if (!sourceUrl && !sourceName) {
    stages.source.passed = false;
    stages.source.errors.push("missing_source");
    errors.push({ stage: "source", code: "missing_source", message: "المصدر مطلوب" });
  }
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl) && !sourceUrl.includes("_")) {
    stages.source.passed = false;
    stages.source.errors.push("invalid_source_url");
    errors.push({ stage: "source", code: "invalid_source_url", message: "رابط المصدر غير صالح" });
  }

  // Metadata validation
  stages.metadata = { passed: true, errors: [] };
  if (pipeline) {
    for (const field of pipeline.requiredFields) {
      const val = item[field] ?? item.metadata?.[field];
      if (val === undefined || val === null || val === "") {
        stages.metadata.passed = false;
        stages.metadata.errors.push(`missing_${field}`);
        errors.push({ stage: "metadata", code: `missing_${field}`, message: `الحقل ${field} مطلوب` });
      }
    }
  }

  // Quality validation
  const body = item.body || item.text || item.question || "";
  stages.quality = { passed: true, errors: [] };
  if (body.length < MIN_BODY_LENGTH) {
    stages.quality.passed = false;
    stages.quality.errors.push("body_too_short");
    errors.push({ stage: "quality", code: "body_too_short", message: "النص قصير جداً" });
  }
  if (hasPlaceholder(body) || hasPlaceholder(item.title || "")) {
    stages.quality.passed = false;
    stages.quality.errors.push("placeholder_detected");
    errors.push({ stage: "quality", code: "placeholder_detected", message: "محتوى تجريبي مرفوض" });
  }
  const qualityScore = item.quality_score ?? item.metadata?.quality_score ?? 75;
  if (qualityScore < MIN_QUALITY_SCORE) {
    stages.quality.passed = false;
    stages.quality.errors.push("low_quality_score");
    errors.push({ stage: "quality", code: "low_quality_score", message: "درجة الجودة منخفضة" });
  }

  // Language validation
  stages.language = { passed: true, errors: [] };
  if (arabicRatio(body) < ARABIC_RATIO_MIN) {
    stages.language.passed = false;
    stages.language.errors.push("insufficient_arabic");
    errors.push({ stage: "language", code: "insufficient_arabic", message: "النص ليس عربياً بشكل كافٍ" });
  }

  // Formatting validation
  stages.formatting = { passed: true, errors: [] };
  const normalized = normalizeArabicText(body);
  if (normalized !== normalizeArabicText(normalized)) {
    stages.formatting.passed = false;
  }
  if (/(\.{4,}|_{4,}|={4,})/.test(body)) {
    stages.formatting.passed = false;
    stages.formatting.errors.push("malformed_content");
    errors.push({ stage: "formatting", code: "malformed_content", message: "تنسيق غير مقبول" });
  }

  stages.duplicate = { passed: true, errors: [], note: "checked separately in dedup module" };

  const passed = errors.length === 0;
  return {
    passed,
    errors,
    stages,
    validationStages: VALIDATION_STAGES,
  };
}

export function classifyContent(item, pipelineId) {
  const meta = item.metadata || {};
  return {
    pipeline: pipelineId,
    category: meta.category || item.category || "عام",
    topic: meta.topic || item.topic || meta.section || null,
    difficulty: meta.difficulty || item.difficulty || item.level || "متوسط",
    keywords: meta.keywords || item.keywords || [],
  };
}
