/**
 * Auto-publish decision engine — trusted sources only, strict rules.
 * Optional fields must not block publishing.
 */
import { validateLessonDraft } from "./content-validator.mjs";

const AUTO_PUBLISH_MIN_CONFIDENCE = 0.95;
const TRUSTED_LEVELS = new Set(["official", "trusted"]);

function pick(data, ...keys) {
  for (const k of keys) {
    const v = data?.[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

/** Critical fields only — used for auto-publish gate, not manual publish. */
export function validateAutomationRequiredFields(parsed, { sourceUrl, imageUrl } = {}) {
  const missing = [];
  const validation = validateLessonDraft(parsed);
  const normalized = validation.normalized || parsed;

  if (!pick(normalized, "title")) missing.push("title");
  if (!pick(normalized, "start_date", "gregorian_date") && !pick(normalized, "day_of_week", "day")) {
    missing.push("date");
  }
  if (!pick(normalized, "lesson_time", "time")) missing.push("lesson_time");
  if (!sourceUrl && !pick(normalized, "source_url", "website_url")) missing.push("source_url");
  return missing;
}

function isFutureDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

export function evaluateAutoPublish({
  source,
  parsed,
  confidenceScore,
  duplicate,
  sheikhMatch,
  sourceUrl,
  imageUrl,
}) {
  const reasons = [];
  const validation = validateLessonDraft(parsed);
  const normalized = validation.normalized || parsed;
  const missing = validateAutomationRequiredFields(normalized, { sourceUrl, imageUrl });

  if (missing.length) {
    reasons.push(`حقول أساسية ناقصة: ${missing.join(", ")}`);
  }
  for (const e of validation.errors || []) {
    reasons.push(e.message);
  }

  if (!source) {
    return { decision: "pending_review", autoPublish: false, reasons: ["مصدر غير معروف"], missing };
  }

  if (!source.active) reasons.push("المصدر معطّل");
  if (!TRUSTED_LEVELS.has(source.trust_level)) reasons.push(`مستوى ثقة غير كافٍ: ${source.trust_level}`);
  if (!source.auto_publish_allowed) reasons.push("Auto-Publish غير مفعّل لهذا المصدر");
  if ((confidenceScore ?? 0) < AUTO_PUBLISH_MIN_CONFIDENCE) {
    reasons.push(`ثقة منخفضة (${Math.round((confidenceScore ?? 0) * 100)}% < 95%)`);
  }

  if (duplicate?.isDuplicate) {
    return {
      decision: "duplicate",
      autoPublish: false,
      reasons: [duplicate.message || "تكرار"],
      missing,
      duplicate,
    };
  }

  const title = pick(normalized, "title");
  if (title.length < 4) reasons.push("العنوان غير واضح");

  const dateStr = pick(normalized, "start_date", "gregorian_date");
  const dayOfWeek = pick(normalized, "day_of_week", "day");
  if (dateStr && !isFutureDate(dateStr)) reasons.push("التاريخ ليس في المستقبل");
  if (!dateStr && !dayOfWeek) reasons.push("لا يوجد تاريخ أو يوم");

  if (!sourceUrl && !pick(normalized, "source_url", "website_url")) {
    reasons.push("لا يوجد مصدر أصلي");
  }

  // Important but non-blocking for manual publish — only warn for auto-publish
  if (!pick(normalized, "speaker_name", "sheikh_name") && !sheikhMatch?.matched?.id) {
    reasons.push("اسم الشيخ غير متوفر (لا يمنع النشر اليدوي)");
  }
  if (!pick(normalized, "mosque", "location", "region", "live_url")) {
    reasons.push("المكان غير متوفر (لا يمنع النشر اليدوي)");
  }
  if (!imageUrl) reasons.push("صورة الإعلان مفقودة — مراجعة موصى بها");

  const canAuto =
    source.active &&
    source.auto_publish_allowed &&
    TRUSTED_LEVELS.has(source.trust_level) &&
    (confidenceScore ?? 0) >= AUTO_PUBLISH_MIN_CONFIDENCE &&
    missing.length === 0 &&
    validation.canPublish &&
    title.length >= 4 &&
    (dateStr ? isFutureDate(dateStr) : Boolean(dayOfWeek)) &&
    Boolean(sourceUrl || pick(normalized, "source_url", "website_url"));

  if (canAuto) {
    return { decision: "approved", autoPublish: true, reasons: [], missing: [] };
  }

  return {
    decision: validation.canPublish ? "approved_manual" : "pending_review",
    autoPublish: false,
    reasons,
    missing,
    dataIncomplete: validation.dataIncomplete,
  };
}

export { AUTO_PUBLISH_MIN_CONFIDENCE };
