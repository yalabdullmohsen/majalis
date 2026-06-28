/**
 * Validates lesson/course drafts — required vs important vs optional.
 */
import {
  generateLessonTitle,
  hasResolvableDate,
  hasResolvableSource,
  hasResolvableTime,
  hasResolvableTitle,
  normalizeLessonRow,
} from "../content-import/lesson-field-policy.mjs";

function pick(data, ...keys) {
  for (const k of keys) {
    const v = data?.[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function normalizeTime(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  const arDigits = "٠١٢٣٤٥٦٧٨٩";
  let out = v;
  for (let i = 0; i < arDigits.length; i++) {
    out = out.replaceAll(arDigits[i], String(i));
  }
  return out.replace(/\s+/g, " ").trim();
}

function hasConflict(data) {
  const conflicts = [];
  const day = pick(data, "day_of_week", "day");
  const schedule = pick(data, "schedule");
  if (day && schedule && !schedule.includes(day) && !schedule.includes("أسبوع")) {
    conflicts.push("تعارض بين حقل اليوم والجدول");
  }
  const start = pick(data, "start_date", "gregorian_date");
  const end = pick(data, "end_date");
  if (start && end && start > end) {
    conflicts.push("تاريخ البداية بعد تاريخ النهاية");
  }
  return conflicts;
}

export function validateLessonDraft(data = {}) {
  const normalized = normalizeLessonRow(data);
  const errors = [];
  const warnings = [];
  const missingImportant = [];
  const missingOptional = [];

  if (!hasResolvableTitle(normalized)) {
    normalized.title = generateLessonTitle(normalized);
    warnings.push({ field: "title", message: "تم توليد العنوان تلقائياً" });
  }

  if (!hasResolvableDate(normalized)) {
    errors.push({ field: "date", message: "التاريخ أو اليوم مطلوب للنشر" });
  }

  if (!hasResolvableTime(normalized)) {
    errors.push({ field: "time", message: "الوقت مطلوب للنشر" });
  }

  if (!hasResolvableSource(normalized)) {
    errors.push({ field: "source", message: "مصدر الدرس مطلوب" });
  }

  if (!pick(normalized, "speaker_name", "sheikh_name")) {
    missingImportant.push("sheikh");
    warnings.push({ field: "speaker_name", message: "اسم الشيخ غير متوفر — سيُعرض الدرس مع شارة بيانات ناقصة" });
  }

  if (!pick(normalized, "mosque", "location")) {
    missingImportant.push("mosque");
    warnings.push({ field: "mosque", message: "المسجد غير متوفر" });
  }

  if (!pick(normalized, "region")) missingImportant.push("region");
  if (!pick(normalized, "city", "governorate")) missingImportant.push("city");
  if (!pick(normalized, "category") || normalized.category === "أخرى") {
    missingImportant.push("category");
  }

  for (const field of ["live_url", "maps_url", "contact_phone", "organizer"]) {
    if (!pick(normalized, field)) missingOptional.push(field);
  }

  const time = normalizeTime(pick(normalized, "lesson_time", "time"));
  if (time && time !== "—" && !/\d/.test(time)) {
    warnings.push({ field: "lesson_time", message: "صيغة الوقت غير واضحة — راجع عند الحاجة" });
  }

  const title = pick(normalized, "title");
  if (title && title.length < 4 && !normalized._title_generated) {
    errors.push({ field: "title", message: "العنوان قصير جداً" });
  }

  for (const msg of hasConflict(normalized)) {
    warnings.push({ field: "conflict", message: msg });
  }

  const canPublish = errors.length === 0;
  const dataIncomplete = missingImportant.length > 0 || missingOptional.length > 0;

  return {
    valid: canPublish,
    errors,
    warnings,
    canPublish,
    dataIncomplete,
    missingImportant,
    missingOptional,
    normalized,
  };
}

export function buildLessonSlug(title) {
  const base = String(title || "lesson")
    .trim()
    .slice(0, 80)
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "");
  return base || `lesson-${Date.now()}`;
}

export function buildExternalKey(data) {
  const parts = [
    pick(data, "title").slice(0, 40),
    pick(data, "speaker_name", "sheikh_name"),
    pick(data, "mosque"),
    pick(data, "day_of_week", "day"),
  ].filter(Boolean);
  return parts.join("|").slice(0, 120) || `draft-${Date.now()}`;
}
