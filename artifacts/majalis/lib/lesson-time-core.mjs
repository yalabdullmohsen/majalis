/**
 * Unified lesson time engine — single source of truth for import, repair, and audit.
 * Keep in sync with src/lib/lesson-time.ts
 */

export const KUWAIT_TZ = "Asia/Kuwait";

export const PRAYER_RANKS = [
  "بعد الفجر",
  "بعد الشروق",
  "قبل الظهر",
  "بعد الظهر",
  "بعد العصر",
  "قبل المغرب",
  "بعد المغرب",
  "بعد العشاء",
  "بين العشاءين",
  "بعد قيام الليل",
  "غير مرتبط بصلاة",
];

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const PRAYER_TIME_MINUTES = {
  الفجر: 5 * 60,
  الشروق: 6 * 60 + 30,
  الظهر: 12 * 60 + 15,
  العصر: 15 * 60 + 45,
  المغرب: 18 * 60 + 30,
  العشاء: 20 * 60,
};

const DAY_INDEX = {
  الأحد: 0,
  الاحد: 0,
  الاثنين: 1,
  الإثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الاربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  السبت: 6,
};

/** Detect PM — `\b` fails with Arabic letters in JS. */
export function isPmMarker(text) {
  const t = String(text || "");
  if (/مساء|مساءً|مساءً|pm\b|PM\b/i.test(t)) return true;
  if (/\d\s*:\s*\d{2}\s*م(?:[\s،.]|$|[^\u0600-\u06FF])/u.test(t)) return true;
  if (/\d{1,2}\s*م(?:[\s،.]|$|[^\u0600-\u06FF])/u.test(t)) return true;
  if (/مغرب|العشاء|مساء/u.test(t) && !/قبل/u.test(t)) return true;
  return false;
}

export function isAmMarker(text) {
  const t = String(text || "");
  if (/صباح|صباحًا|صباحاً|am\b|AM\b|فجر|الشروق/u.test(t)) return true;
  if (/\d\s*:\s*\d{2}\s*ص(?:[\s،.]|$|[^\u0600-\u06FF])/u.test(t)) return true;
  if (/\d{1,2}\s*ص(?:[\s،.]|$|[^\u0600-\u06FF])/u.test(t)) return true;
  return false;
}

export function cleanTimeText(time) {
  return String(time || "")
    .replace(/\s*بتوقيت\s+الكويت\s*/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTimeToMinutes(timeRaw) {
  const time = cleanTimeText(timeRaw);
  if (!time) return null;

  const range = time.match(/(\d{1,2})\s*[:٫]\s*(\d{2})\s*(?:[^\d]+?\s*(?:إلى|–|-)\s*(\d{1,2})\s*[:٫]\s*(\d{2}))?/u);
  if (range) {
    let hour = Number(range[1]);
    const minute = Number(range[2]);
    if (isPmMarker(time) && hour < 12) hour += 12;
    if (isAmMarker(time) && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  const hourOnly = time.match(/(\d{1,2})\s*(?:$|[^\d])/u);
  if (hourOnly && (isPmMarker(time) || isAmMarker(time))) {
    let hour = Number(hourOnly[1]);
    if (isPmMarker(time) && hour < 12) hour += 12;
    if (isAmMarker(time) && hour === 12) hour = 0;
    return hour * 60;
  }

  for (const [prayer, minutes] of Object.entries(PRAYER_TIME_MINUTES)) {
    if (time.includes(prayer)) {
      if (/بعد/u.test(time)) return minutes + 20;
      if (/قبل/u.test(time)) return Math.max(0, minutes - 60);
      return minutes;
    }
  }

  return null;
}

export function parseEndTimeToMinutes(timeRaw) {
  const time = cleanTimeText(timeRaw);
  const range = time.match(/(?:إلى|–|-)\s*(\d{1,2})\s*[:٫]\s*(\d{2})/u);
  if (!range) return null;
  let hour = Number(range[1]);
  const minute = Number(range[2]);
  if (isPmMarker(time) && hour < 12) hour += 12;
  if (isAmMarker(time) && hour === 12) hour = 0;
  return hour * 60 + minute;
}

export function minutesTo24hString(minutes) {
  if (minutes == null || !Number.isFinite(minutes)) return null;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function toArabicNumerals(value) {
  return String(value).replace(/\d/g, (d) => AR_DIGITS[Number(d)] ?? d);
}

export function formatTimePeriod(minutes) {
  if (minutes == null) return "";
  return minutes < 12 * 60 ? "صباحاً" : "مساءً";
}

export function formatLessonTimeDisplay(timeRaw, { arabicNumerals = true } = {}) {
  const minutes = parseTimeToMinutes(timeRaw);
  if (minutes == null) return cleanTimeText(timeRaw);

  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  const period = h24 < 12 ? "صباحاً" : "مساءً";
  let display = `${h12}:${String(m).padStart(2, "0")} ${period}`;
  if (arabicNumerals) display = toArabicNumerals(display);
  return display;
}

export function classifyPrayerRank(timeRaw, minutes = null) {
  const time = cleanTimeText(timeRaw);
  if (!time) return "غير مرتبط بصلاة";

  if (/بعد\s*الفجر|بعد\s*صلاة\s*الفجر/u.test(time)) return "بعد الفجر";
  if (/بعد\s*الشروق/u.test(time)) return "بعد الشروق";
  if (/قبل\s*الظهر|قبل\s*صلاة\s*الظهر/u.test(time)) return "قبل الظهر";
  if (/بعد\s*الظهر|بعد\s*صلاة\s*الظهر/u.test(time)) return "بعد الظهر";
  if (/بعد\s*العصر|بعد\s*صلاة\s*العصر/u.test(time)) return "بعد العصر";
  if (/قبل\s*المغرب|قبل\s*صلاة\s*المغرب/u.test(time)) return "قبل المغرب";
  if (/بعد\s*المغرب|بعد\s*صلاة\s*المغرب/u.test(time)) return "بعد المغرب";
  if (/بعد\s*العشاء|بعد\s*صلاة\s*العشاء|إلى\s*صلاة\s*العشاء/u.test(time)) return "بعد العشاء";
  if (/بين\s*العشاء/u.test(time)) return "بين العشاءين";
  if (/قيام\s*الليل|التهجد/u.test(time)) return "بعد قيام الليل";

  const mins = minutes ?? parseTimeToMinutes(time);
  if (mins == null) return "غير مرتبط بصلاة";

  if (mins >= 5 * 60 && mins < 8 * 60) return "بعد الفجر";
  if (mins >= 8 * 60 && mins < 10 * 60) return "بعد الشروق";
  if (mins >= 10 * 60 && mins < 12 * 60 + 15) return "قبل الظهر";
  if (mins >= 12 * 60 + 15 && mins < 14 * 60 + 30) return "بعد الظهر";
  if (mins >= 15 * 60 && mins < 17 * 60 + 30) return "بعد العصر";
  if (mins >= 17 * 60 + 30 && mins < 18 * 60 + 30) return "قبل المغرب";
  if (mins >= 18 * 60 + 30 && mins < 20 * 60) return "بعد المغرب";
  if (mins >= 20 * 60 && mins < 23 * 60) return "بعد العشاء";
  if (mins >= 23 * 60 || mins < 5 * 60) return "بعد قيام الليل";

  return "غير مرتبط بصلاة";
}

export function resolvePrayerRank(row) {
  if (row.prayer_rank_override?.trim()) return row.prayer_rank_override.trim();
  if (row.prayer_rank?.trim()) return row.prayer_rank.trim();
  return classifyPrayerRank(row.lesson_time || row.schedule || "", parseTimeToMinutes(row.lesson_time));
}

export function normalizeLessonTimeFields(row) {
  const raw = cleanTimeText(row.lesson_time || row.time || "");
  const repairs = [];
  const issues = [];

  if (!raw || raw === "—") {
    return {
      lesson_time: raw || null,
      start_time: null,
      end_time: null,
      time_period: null,
      prayer_rank: "غير مرتبط بصلاة",
      issues: ["missing_time"],
      repairs,
    };
  }

  const startMinutes = parseTimeToMinutes(raw);
  const endMinutes = parseEndTimeToMinutes(raw);

  if (startMinutes == null) {
    issues.push("unparseable_time");
  }

  let lessonTime = raw;
  const display = startMinutes != null ? formatLessonTimeDisplay(raw, { arabicNumerals: true }) : raw;

  if (startMinutes != null && display !== raw && /\d/.test(raw)) {
    if (/\d\s*[:٫]\s*\d{2}\s*[مص](?:[\s،.]|$)/u.test(raw)) {
      issues.push("shorthand_am_pm");
    }
    repairs.push({ field: "lesson_time", from: raw, to: display, reason: "normalized_display" });
    lessonTime = display;
  }

  if (endMinutes != null && startMinutes != null && endMinutes <= startMinutes) {
    issues.push("end_before_start");
  }

  const prayerRank = classifyPrayerRank(raw, startMinutes);

  return {
    lesson_time: lessonTime,
    start_time: minutesTo24hString(startMinutes),
    end_time: minutesTo24hString(endMinutes),
    time_period: startMinutes != null ? formatTimePeriod(startMinutes) : null,
    prayer_rank: prayerRank,
    issues,
    repairs,
  };
}

export function auditLessonRow(row) {
  const normalized = normalizeLessonTimeFields(row);
  const issues = [...normalized.issues];

  const day = row.day_of_week || row.day || "";
  if (day && day !== "—" && !DAY_INDEX[day.trim()]) {
    issues.push("invalid_weekday");
  }

  if (row.start_date) {
    const d = new Date(`${row.start_date}T12:00:00+03:00`);
    if (Number.isNaN(d.getTime())) issues.push("invalid_start_date");
  }

  const effectiveRank = resolvePrayerRank({ ...row, prayer_rank: normalized.prayer_rank });
  if (!effectiveRank) issues.push("prayer_rank_missing");

  return {
    id: row.id || row.external_key,
    title: row.title,
    lesson_time: row.lesson_time,
    day_of_week: day,
    issues,
    repairs: normalized.repairs,
    normalized,
    effective_prayer_rank: effectiveRank,
    needs_manual_review: issues.includes("unparseable_time") || issues.includes("end_before_start"),
  };
}

export function applyLessonTimeRepair(row, { logRepairs = true } = {}) {
  const audit = auditLessonRow(row);
  const next = { ...row };
  const repairLog = Array.isArray(row.time_repair_log) ? [...row.time_repair_log] : [];

  if (audit.normalized.lesson_time) next.lesson_time = audit.normalized.lesson_time;
  if (audit.normalized.start_time) next.start_time = audit.normalized.start_time;
  if (audit.normalized.end_time) next.end_time = audit.normalized.end_time;
  if (audit.normalized.time_period) next.time_period = audit.normalized.time_period;
  if (!next.prayer_rank_override) next.prayer_rank = audit.normalized.prayer_rank;

  if (audit.repairs.length && logRepairs) {
    repairLog.push({
      at: new Date().toISOString(),
      repairs: audit.repairs,
      issues: audit.issues,
    });
    next.time_repair_log = repairLog;
  }

  return { row: next, audit };
}
