const KUWAIT_TZ = "Asia/Kuwait";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const DAY_INDEX: Record<string, number> = {
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

const EN_WEEKDAY_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const PRAYER_TIME_MINUTES: Record<string, number> = {
  الفجر: 5 * 60,
  الشروق: 6 * 60 + 30,
  الظهر: 12 * 60 + 15,
  العصر: 15 * 60 + 45,
  المغرب: 18 * 60 + 30,
  العشاء: 20 * 60,
};

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
] as const;

export type PrayerRank = (typeof PRAYER_RANKS)[number];

export type KuwaitClock = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
};

/** Detect PM — JS `\b` word boundaries fail with Arabic letters. */
export function isPmMarker(text: string): boolean {
  const t = String(text || "");
  if (/مساء|مساءً|pm\b|PM\b/i.test(t)) return true;
  if (/\d\s*:\s*\d{2}\s*م(?:[\s،.]|$|[^\u0600-\u06FF])/u.test(t)) return true;
  if (/\d{1,2}\s*م(?:[\s،.]|$|[^\u0600-\u06FF])/u.test(t)) return true;
  if (/مغرب|العشاء|مساء/u.test(t) && !/قبل/u.test(t)) return true;
  return false;
}

export function isAmMarker(text: string): boolean {
  const t = String(text || "");
  if (/صباح|صباحًا|صباحاً|am\b|AM\b|فجر|الشروق/u.test(t)) return true;
  if (/\d\s*:\s*\d{2}\s*ص(?:[\s،.]|$|[^\u0600-\u06FF])/u.test(t)) return true;
  if (/\d{1,2}\s*ص(?:[\s،.]|$|[^\u0600-\u06FF])/u.test(t)) return true;
  return false;
}

export function cleanTimeText(time: string): string {
  return String(time || "")
    .replace(/\s*بتوقيت\s+الكويت\s*/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toArabicNumerals(value: string | number): string {
  return String(value).replace(/\d/g, (d) => AR_DIGITS[Number(d)] ?? d);
}

export function formatTimePeriod(minutes: number | null): string {
  if (minutes == null) return "";
  return minutes < 12 * 60 ? "صباحاً" : "مساءً";
}

export function minutesTo24hString(minutes: number | null): string | null {
  if (minutes == null || !Number.isFinite(minutes)) return null;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatLessonTimeDisplay(timeRaw: string, { arabicNumerals = true } = {}): string {
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

export function classifyPrayerRank(timeRaw: string, minutes: number | null = null): PrayerRank {
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

export function resolvePrayerRank(row: {
  prayer_rank?: string | null;
  prayer_rank_override?: string | null;
  lesson_time?: string | null;
  schedule?: string | null;
}): PrayerRank {
  if (row.prayer_rank_override?.trim()) return row.prayer_rank_override.trim() as PrayerRank;
  if (row.prayer_rank?.trim()) return row.prayer_rank.trim() as PrayerRank;
  return classifyPrayerRank(row.lesson_time || row.schedule || "");
}

/** وقت مختصر للبطاقات — مثل «بعد المغرب». */
export function formatShortLessonTime(time: string): string {
  const t = cleanTimeText(time);
  if (!t) return "";
  if (/مغرب/u.test(t)) return "بعد المغرب";
  if (/فجر/u.test(t)) return "بعد الفجر";
  if (/عصر/u.test(t)) return "بعد العصر";
  if (/ظهر/u.test(t)) return "بعد الظهر";
  if (/عشاء/u.test(t)) return "بعد العشاء";
  const parsed = parseTimeToMinutes(t);
  if (parsed != null) return formatLessonTimeDisplay(t);
  return t.length > 24 ? `${t.slice(0, 22).trim()}…` : t;
}

export function getKuwaitClock(date = new Date()): KuwaitClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KUWAIT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value || 0);

  const weekdayName = parts.find((p) => p.type === "weekday")?.value || "Sunday";

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    weekday: EN_WEEKDAY_TO_INDEX[weekdayName] ?? 0,
    hour: read("hour"),
    minute: read("minute"),
  };
}

export function parseTimeToMinutes(timeRaw: string): number | null {
  const time = cleanTimeText(timeRaw);
  if (!time) return null;

  const explicit = time.match(/(\d{1,2})\s*[:٫]\s*(\d{2})/u);
  if (explicit) {
    let hour = Number(explicit[1]);
    const minute = Number(explicit[2]);
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

function kuwaitDateAt(dayOffset: number, minutes: number, base = new Date()): Date {
  const clock = getKuwaitClock(base);
  const utc = Date.UTC(clock.year, clock.month - 1, clock.day + dayOffset, 0, 0, 0);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const local = new Date(utc);
  local.setUTCHours(hour - 3, minute, 0, 0);
  return local;
}

export function computeNextOccurrenceMs(day: string, time: string, now = new Date()): number {
  const targetDay = DAY_INDEX[day.trim()] ?? DAY_INDEX[day];
  if (targetDay == null) return now.getTime() + 365 * 24 * 60 * 60 * 1000;

  const clock = getKuwaitClock(now);
  const timeMinutes = parseTimeToMinutes(time) ?? PRAYER_TIME_MINUTES.المغرب;
  let daysUntil = (targetDay - clock.weekday + 7) % 7;
  const nowMinutes = clock.hour * 60 + clock.minute;

  if (daysUntil === 0 && nowMinutes >= timeMinutes + 90) {
    daysUntil = 7;
  }

  return kuwaitDateAt(daysUntil, timeMinutes, now).getTime();
}

export function formatGregorianDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-KW", {
    timeZone: KUWAIT_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatHijriDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      timeZone: KUWAIT_TZ,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export function formatRelativeTime(targetMs: number, now = Date.now()): string {
  const diffMs = targetMs - now;
  if (diffMs <= 0) return "الآن";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    if (minutes <= 1) return "الآن";
    if (minutes === 2) return "بعد دقيقتين";
    if (minutes <= 10) return `بعد ${minutes} دقائق`;
    return `بعد ${minutes} دقيقة`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "بعد ساعة";
  if (hours === 2) return "بعد ساعتين";
  if (hours < 24) return `بعد ${hours} ساعات`;

  const days = Math.floor(minutes / (24 * 60));
  if (days === 1) return "غداً";
  if (days === 2) return "بعد يومين";
  if (days <= 6) return `بعد ${days} أيام`;
  if (days <= 13) return "الأسبوع القادم";
  if (days <= 20) return "بعد أسبوعين";

  const months = Math.floor(days / 30);
  if (months >= 1) return months === 1 ? "بعد شهر" : `بعد ${months} أشهر`;
  return `بعد ${days} أيام`;
}

export function isOccurrencePast(day: string, time: string, recurring = true, now = new Date()): boolean {
  if (!day) return false;
  const nextMs = computeNextOccurrenceMs(day, time, now);
  const clock = getKuwaitClock(now);
  const targetDay = DAY_INDEX[day.trim()] ?? DAY_INDEX[day];
  if (targetDay == null) return false;

  const daysUntil = (targetDay - clock.weekday + 7) % 7;
  const timeMinutes = parseTimeToMinutes(time) ?? PRAYER_TIME_MINUTES.المغرب;
  const nowMinutes = clock.hour * 60 + clock.minute;

  if (daysUntil === 0 && nowMinutes >= timeMinutes + 90) {
    return !recurring;
  }

  if (!recurring && nextMs < now.getTime()) return true;
  return false;
}

export { KUWAIT_TZ };
