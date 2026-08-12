/**
 * Validates lesson/course drafts before publish.
 */

// حقل العنوان فقط إلزامي — باقي الحقول تصبح تحذيرات لزيادة كمية المحتوى المستورد
const REQUIRED_LESSON_FIELDS = [
  { key: "title", label: "عنوان الدرس" },
];

const RECOMMENDED_LESSON_FIELDS = [
  { key: "speaker_name", label: "اسم الشيخ", alt: "sheikh_name" },
  { key: "day_of_week", label: "اليوم", alt: "day" },
  { key: "lesson_time", label: "الوقت", alt: "time" },
  { key: "mosque", label: "المسجد", alt: "location" },
  { key: "city", label: "المدينة", alt: "governorate" },
];

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
  const errors = [];
  const warnings = [];

  for (const field of REQUIRED_LESSON_FIELDS) {
    const value = pick(data, field.key, ...(field.alt ? [field.alt] : []));
    if (!value) {
      errors.push({ field: field.key, message: `${field.label} مطلوب للنشر` });
    }
  }

  for (const field of RECOMMENDED_LESSON_FIELDS) {
    const value = pick(data, field.key, ...(field.alt ? [field.alt] : []));
    if (!value) {
      warnings.push({ field: field.key, message: `${field.label} غير مكتمل — يُنصح بإضافته` });
    }
  }

  const time = normalizeTime(pick(data, "lesson_time", "time"));
  if (time && !/\d/.test(time)) {
    warnings.push({ field: "lesson_time", message: "صيغة الوقت غير واضحة — راجع قبل النشر" });
  }

  const title = pick(data, "title");
  if (title && title.length < 4) {
    errors.push({ field: "title", message: "العنوان قصير جداً" });
  }

  for (const msg of hasConflict(data)) {
    errors.push({ field: "conflict", message: msg });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    canPublish: errors.length === 0,
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

// Strip Arabic diacritics and normalize letter variants before building the key
// so that دiacritics differences don't create separate duplicate records.
function normalizeForKey(text) {
  return String(text || "")
    .trim()
    .replace(/[ً-ٰٟـ]/g, "") // tashkeel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function buildExternalKey(data) {
  const parts = [
    normalizeForKey(pick(data, "title")).slice(0, 40),
    normalizeForKey(pick(data, "speaker_name", "sheikh_name")),
    normalizeForKey(pick(data, "mosque")),
    normalizeForKey(pick(data, "day_of_week", "day")),
  ].filter(Boolean);
  return parts.join("|").slice(0, 120) || `draft-${Date.now()}`;
}
