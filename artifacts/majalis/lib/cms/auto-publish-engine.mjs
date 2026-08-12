/**
 * Auto-publish decision engine — trusted sources only, strict rules.
 */
import { validateLessonDraft } from "./content-validator.mjs";

// خُفِّض من 0.95 للسماح بنشر محتوى أكثر
const AUTO_PUBLISH_MIN_CONFIDENCE = 0.65;
const TRUSTED_LEVELS = new Set(["official", "trusted", "community"]);

function pick(data, ...keys) {
  for (const k of keys) {
    const v = data?.[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

// حقل العنوان فقط إلزامي — باقي الحقول اختيارية لاستيعاب بيانات ناقصة
export function validateAutomationRequiredFields(parsed, { sourceUrl, imageUrl } = {}) {
  const missing = [];
  if (!pick(parsed, "title")) missing.push("title");
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

  if (!TRUSTED_LEVELS.has(source.trust_level)) {
    reasons.push(`مستوى ثقة غير كافٍ: ${source.trust_level}`);
  }

  if (!source.auto_publish_allowed) {
    reasons.push("Auto-Publish غير مفعّل لهذا المصدر");
  }

  if ((confidenceScore ?? 0) < AUTO_PUBLISH_MIN_CONFIDENCE) {
    reasons.push(`ثقة منخفضة (${Math.round((confidenceScore ?? 0) * 100)}% < 65%)`);
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

  const hasSheikh = Boolean(sheikhMatch?.matched?.id || pick(parsed, "speaker_name"));
  if (!hasSheikh) {
    reasons.push("اسم الشيخ غير معروف");
  }

  if (!sourceUrl) {
    reasons.push("لا يوجد مصدر أصلي");
  }

  const canAuto =
    source.active &&
    TRUSTED_LEVELS.has(source.trust_level) &&
    (confidenceScore ?? 0) >= AUTO_PUBLISH_MIN_CONFIDENCE &&
    missing.length === 0 &&
    validation.canPublish &&
    title.length >= 3;

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

export { AUTO_PUBLISH_MIN_CONFIDENCE };
