/**
 * Auto-publish decision engine — trusted sources only, strict rules.
 */
import { validateLessonDraft } from "./content-validator.mjs";

/** حد الثقة للنشر التلقائي — أقل منه → مراجعة بشرية. */
const AUTO_PUBLISH_MIN_CONFIDENCE = 0.95;
/** مستويات مسموح لها بالنشر التلقائي (المجتمع → مراجعة فقط). */
const AUTO_PUBLISH_LEVELS = new Set(["official", "trusted"]);

function pick(data, ...keys) {
  for (const k of keys) {
    const v = data?.[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

/** حقول لازمة لجودة المسودة قبل النشر التلقائي. */
export function validateAutomationRequiredFields(parsed, { sourceUrl, imageUrl } = {}) {
  const missing = [];
  if (!pick(parsed, "title")) missing.push("title");
  if (!pick(parsed, "speaker_name", "sheikh_name")) missing.push("speaker_name");
  if (!pick(parsed, "start_date", "gregorian_date") && !pick(parsed, "day_of_week", "day")) {
    missing.push("date_or_day");
  }
  if (!pick(parsed, "mosque", "location") && !pick(parsed, "region") && !pick(parsed, "live_url")) {
    missing.push("place_or_live");
  }
  if (!imageUrl) missing.push("image");
  if (!sourceUrl) missing.push("source_url");
  return missing;
}

function isFutureDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return true; // recurring lessons without fixed date — allow if day_of_week set
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
  const missing = validateAutomationRequiredFields(parsed, { sourceUrl, imageUrl });
  const validation = validateLessonDraft(parsed);

  if (missing.length) {
    reasons.push(`حقول ناقصة: ${missing.join(", ")}`);
  }
  for (const e of validation.errors || []) {
    reasons.push(e.message);
  }

  if (!source) {
    return { decision: "pending_review", autoPublish: false, reasons: ["مصدر غير معروف"], missing };
  }

  if (!source.active) {
    reasons.push("المصدر معطّل");
  }

  if (!AUTO_PUBLISH_LEVELS.has(source.trust_level)) {
    reasons.push(`مستوى ثقة غير كافٍ للنشر التلقائي: ${source.trust_level}`);
  }

  if (!source.auto_publish_allowed) {
    reasons.push("Auto-Publish غير مفعّل لهذا المصدر");
  }

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

  const title = pick(parsed, "title");
  if (title.length < 4) {
    reasons.push("العنوان غير واضح");
  }

  const dateStr = pick(parsed, "start_date", "gregorian_date");
  const dayOfWeek = pick(parsed, "day_of_week", "day");
  if (dateStr && !isFutureDate(dateStr)) {
    reasons.push("التاريخ ليس في المستقبل");
  }
  if (!dateStr && !dayOfWeek) {
    reasons.push("لا يوجد تاريخ أو يوم");
  }

  const mosque = pick(parsed, "mosque", "location");
  const region = pick(parsed, "region");
  const liveUrl = pick(parsed, "live_url");
  const hasPlace = Boolean(mosque || region || liveUrl);
  if (!hasPlace) {
    reasons.push("المكان أو رابط البث غير واضح");
  }

  if (!imageUrl) {
    reasons.push("صورة الإعلان مطلوبة للنشر التلقائي");
  }

  const hasSheikh = Boolean(sheikhMatch?.matched?.id || pick(parsed, "speaker_name", "sheikh_name"));
  if (!hasSheikh) {
    reasons.push("اسم الشيخ غير معروف");
  }

  if (!sourceUrl) {
    reasons.push("لا يوجد مصدر أصلي");
  }

  // القرار يعتمد على *كل* الأسباب — لا تُجمَع ثم تُتجاهل.
  const canAuto =
    reasons.length === 0 &&
    missing.length === 0 &&
    Boolean(validation.canPublish) &&
    source.active &&
    AUTO_PUBLISH_LEVELS.has(source.trust_level) &&
    source.auto_publish_allowed === true &&
    (confidenceScore ?? 0) >= AUTO_PUBLISH_MIN_CONFIDENCE;

  if (canAuto) {
    return {
      decision: "approved",
      autoPublish: true,
      reasons: [],
      missing: [],
    };
  }

  return {
    decision: "pending_review",
    autoPublish: false,
    reasons,
    missing,
  };
}

export { AUTO_PUBLISH_MIN_CONFIDENCE, AUTO_PUBLISH_LEVELS };
