const KUWAIT_TZ = "Asia/Kuwait";

export const DAY_INDEX: Record<string, number> = {
  الأحد: 0,
  الاثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
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

// Mutable cache — updated at runtime from the real prayer times API.
// Defaults are coarse annual-average fallbacks used before the first API response.
const prayerCache: Record<string, number> = {
  الفجر:  3 * 60 + 45,
  الشروق: 5 * 60 + 10,
  الظهر:  12 * 60,
  العصر:  15 * 60 + 30,
  المغرب: 19 * 60 + 15,
  العشاء: 20 * 60 + 45,
};

// Maps Aladhan API prayer keys to the Arabic names used in prayerCache.
const API_KEY_MAP: Record<string, string> = {
  Fajr:    "الفجر",
  Sunrise: "الشروق",
  Dhuhr:   "الظهر",
  Asr:     "العصر",
  Maghrib: "المغرب",
  Isha:    "العشاء",
};

/**
 * Update prayer-time cache from live API data.
 * Call once after `fetchPrayerTimes()` resolves so lesson countdowns
 * use accurate seasonal times rather than hardcoded averages.
 */
export function setPrayerTimesCache(
  prayers: Array<{ key: string; minutes: number | null }>,
): void {
  for (const { key, minutes } of prayers) {
    const arabic = API_KEY_MAP[key];
    if (arabic && minutes != null && minutes > 0) {
      prayerCache[arabic] = minutes;
    }
  }
}

// Kept for legacy callers that reference PRAYER_TIME_MINUTES directly.
const PRAYER_TIME_MINUTES = prayerCache;

export type KuwaitClock = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
};

export function cleanTimeText(time: string): string {
  return String(time || "")
    .replace(/\s*بتوقيت\s+الكويت\s*/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** وقت مختصر للبطاقات — يعرض الساعة الصريحة إن وُجدت، وإلا يكتب «بعد صلاة X». */
export function formatShortLessonTime(time: string): string {
  const t = cleanTimeText(time);
  if (!t) return "";

  // إذا كان الوقت محدداً بالساعة (مثل 4:30م أو 8م أو 7 مساءً)، اعرضه كما هو
  if (/\d{1,2}\s*[:٫]\s*\d{2}/u.test(t) || /\d{1,2}\s*(م|ص|مساء|صباح)/u.test(t)) {
    return t.length > 26 ? `${t.slice(0, 24).trim()}…` : t;
  }

  // أوقات الصلاة — يُضاف «صلاة» للوضوح
  if (/مغرب/u.test(t)) return "بعد صلاة المغرب";
  if (/فجر/u.test(t)) return "بعد صلاة الفجر";
  if (/عصر/u.test(t)) return "بعد صلاة العصر";
  if (/ظهر/u.test(t)) return "بعد صلاة الظهر";
  if (/عشاء/u.test(t)) return "بعد صلاة العشاء";
  if (/شروق/u.test(t)) return "بعد صلاة الشروق";
  if (/الصباح|صباح/u.test(t)) return "صباحاً";
  if (/مساء/u.test(t)) return "مساءً";
  return t.length > 26 ? `${t.slice(0, 24).trim()}…` : t;
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

// Prayer roots — reads from the live cache so seasonal times are always accurate.
// Evaluated lazily at call time (via function) rather than captured once at module load.
function getPrayerRoots(): Array<[RegExp, number]> {
  return [
    [/فجر/u,  prayerCache.الفجر],
    [/شروق/u, prayerCache.الشروق],
    [/ظهر/u,  prayerCache.الظهر],
    [/عصر/u,  prayerCache.العصر],
    [/مغرب/u, prayerCache.المغرب],
    [/عشاء/u, prayerCache.العشاء],
  ];
}

export function parseTimeToMinutes(timeRaw: string): number | null {
  // Normalize Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) to ASCII so all regexes work.
  const time = cleanTimeText(timeRaw).replace(
    /[٠-٩]/gu,
    (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)),
  );
  if (!time) return null;

  // --- Context signals read from the full string BEFORE any early return ---
  // Evening prayers → this time is PM regardless of explicit م/ص marker.
  const hasPMContext =
    /عشاء|مغرب|عصر|ظهر|مساء/u.test(time) || /pm/i.test(time);
  // Morning prayers → this time is AM.
  const hasAMContext =
    /فجر|شروق|صباح/u.test(time) || /am/i.test(time);

  // HH:MM (handles "8:50", "8:50م", "8:50 بعد صلاة العشاء", etc.)
  const explicit = time.match(/(\d{1,2})\s*[:٫]\s*(\d{2})/u);
  if (explicit) {
    let hour = Number(explicit[1]);
    const minute = Number(explicit[2]);
    const tail = time.slice((explicit.index ?? 0) + explicit[0].length).trimStart();

    // Explicit suffix beats context; context beats the Kuwait-hours heuristic.
    const explicitPM =
      /^م(?![؀-ۿ])/u.test(tail) || /^مساء/u.test(tail);
    const explicitAM =
      /^ص(?![؀-ۿ])/u.test(tail) || /^صباح/u.test(tail);

    const isPM = explicitPM || (!explicitAM && hasPMContext);
    const isAM = explicitAM || (!explicitPM && hasAMContext);

    if (isPM && hour < 12) hour += 12;
    else if (isAM && hour === 12) hour = 0;
    // Heuristic for Kuwait lesson schedules: hours 1–9 with no marker and no
    // prayer context are always PM — no lesson in Kuwait happens at 1–9 AM.
    else if (!isPM && !isAM && hour >= 1 && hour <= 9) hour += 12;

    return hour * 60 + minute;
  }

  // H + explicit AM/PM suffix only (e.g. "8م", "8مساء", "8 مساءً")
  const hourOnly = time.match(/(\d{1,2})\s*(م(?:ساء[ًا]?)?|ص(?:باح[ًا]?)?)/u);
  if (hourOnly) {
    let hour = Number(hourOnly[1]);
    const suffix = hourOnly[2];
    if (/^م/u.test(suffix) && hour < 12) hour += 12;
    else if (/^ص/u.test(suffix) && hour === 12) hour = 0;
    // Apply Kuwait heuristic here too when suffix is ambiguous.
    else if (hour >= 1 && hour <= 9 && hasPMContext) hour += 12;
    return hour * 60;
  }

  // Prayer-relative times (بعد المغرب، قبل الفجر، …)
  for (const [root, minutes] of getPrayerRoots()) {
    if (root.test(time)) {
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
  const targetDay = DAY_INDEX[day];
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
  if (diffMs <= 0) return "جارٍ الآن";

  const totalMinutes = Math.floor(diffMs / 60_000);
  if (totalMinutes <= 1) return "جارٍ الآن";
  if (totalMinutes === 2) return "بعد دقيقتين";
  if (totalMinutes < 60) {
    if (totalMinutes <= 10) return `بعد ${totalMinutes} دقائق`;
    return `بعد ${totalMinutes} دقيقة`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMin = totalMinutes % 60;
  if (hours < 24) {
    const base =
      hours === 1 ? "ساعة" :
      hours === 2 ? "ساعتين" :
      `${hours} ساعات`;
    if (remainingMin === 0) return `بعد ${base}`;
    const minLabel =
      remainingMin === 1 ? "دقيقة" :
      remainingMin === 2 ? "دقيقتين" :
      remainingMin <= 10 ? `${remainingMin} دقائق` :
      `${remainingMin} دقيقة`;
    return `بعد ${base} و${minLabel}`;
  }

  const days = Math.floor(totalMinutes / (24 * 60));
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
  const targetDay = DAY_INDEX[day];
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
