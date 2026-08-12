/**
 * Vision Intelligence 2 — extended field extraction + validation.
 * Wraps vision-intelligence.mjs (v1).
 */
import { analyzeContentItem, analyzeImage } from "./vision-intelligence.mjs";

const V2_FIELDS = [
  "title", "speaker_name", "course_title", "mosque", "region", "city", "governorate",
  "gregorian_date", "hijri_date", "day_of_week", "lesson_time", "start_date", "end_date",
  "organizer", "cooperative_org", "category", "activity_type", "is_course",
  "language", "keywords", "qr_code", "logo_detected", "registration_url", "maps_url",
  "live_url", "phone", "contact_phone", "contact_whatsapp", "women_section",
  "has_women_section", "poster_tags", "raw_ocr_text", "notes",
];

export async function analyzeContentItemV2(ctx) {
  const base = await analyzeContentItem(ctx);
  const parsed = normalizeParsed(base.parsed || {});
  const validation = validateExtractedFields(parsed);

  return {
    ...base,
    parsed,
    v2: {
      fieldsExtracted: V2_FIELDS.filter((f) => parsed[f] != null && parsed[f] !== ""),
      validation,
      completeness: validation.completeness,
      fieldCount: validation.fieldCount,
    },
    metrics: {
      ...base.metrics,
      fieldCompleteness: validation.completeness,
      validationScore: validation.score,
      combinedConfidence: Math.max(
        base.metrics?.combinedConfidence ?? 0,
        validation.score * 0.4,
      ),
    },
  };
}

export async function analyzeImageV2(ctx) {
  const base = await analyzeImage(ctx);
  const parsed = normalizeParsed(base.parsed || {});
  const validation = validateExtractedFields(parsed);

  return {
    ...base,
    parsed,
    v2: { validation, completeness: validation.completeness },
    metrics: {
      ...base.metrics,
      fieldCompleteness: validation.completeness,
      validationScore: validation.score,
    },
  };
}

function normalizeParsed(raw) {
  const p = { ...raw };

  if (p.course_title && !p.title) p.title = p.course_title;
  if (p.contact_phone && !p.phone) p.phone = p.contact_phone;
  if (p.time && !p.lesson_time) p.lesson_time = p.time;
  if (p.governorate && !p.region) p.region = p.governorate;
  if (p.is_course == null && /دورة|برنامج|سلسلة/i.test(String(p.title || ""))) {
    p.is_course = true;
    p.activity_type = p.activity_type || "دورة";
  }
  if (!p.activity_type) p.activity_type = p.is_course ? "دورة" : "درس";
  if (!p.language) p.language = detectLanguage(p.raw_ocr_text || p.title || "");

  if (p.qr_code || /qr|باركود/i.test(String(p.raw_ocr_text || ""))) {
    p.qr_detected = true;
  }

  return p;
}

function validateExtractedFields(parsed) {
  const required = ["title"];
  const important = ["speaker_name", "mosque", "lesson_time", "gregorian_date", "day_of_week"];
  const optional = V2_FIELDS.filter((f) => !required.includes(f) && !important.includes(f));

  const present = (fields) => fields.filter((f) => parsed[f] != null && String(parsed[f]).trim() !== "");
  const reqPresent = present(required);
  const impPresent = present(important);
  const optPresent = present(optional);

  const completeness =
    (reqPresent.length / required.length) * 0.4 +
    (impPresent.length / important.length) * 0.45 +
    (optPresent.length / Math.max(optional.length, 1)) * 0.15;

  const issues = [];
  if (!reqPresent.length) issues.push("missing_title");
  if (!impPresent.includes("speaker_name")) issues.push("missing_sheikh");
  if (!impPresent.includes("mosque") && !parsed.region) issues.push("missing_location");
  if (!impPresent.includes("lesson_time")) issues.push("missing_time");

  return {
    completeness: Math.round(completeness * 100) / 100,
    score: Math.round(completeness * 100) / 100,
    fieldCount: present(V2_FIELDS).length,
    issues,
    required: reqPresent,
    important: impPresent,
  };
}

function detectLanguage(text) {
  const ar = (String(text).match(/[\u0600-\u06FF]/g) || []).length;
  return ar / Math.max(String(text).length, 1) > 0.25 ? "ar" : "unknown";
}

export { V2_FIELDS };
