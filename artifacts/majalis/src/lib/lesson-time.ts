const KUWAIT_TZ = "Asia/Kuwait";

const DAY_INDEX: Record<string, number> = {
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

const PRAYER_TIME_MINUTES: Record<string, number> = {
  الفجر: 5 * 60,
  الشروق: 6 * 60 + 30,
  الظهر: 12 * 60 + 15,
  العصر: 15 * 60 + 45,
  المغرب: 18 * 60 + 30,
  العشاء: 20 * 60,
};

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

/** وقت مختصر للبطاقات — مثل «بعد المغرب» أو «4:00 م». */
export function formatShortLessonTime(time: string): string {
  const t = cleanTimeText(time);
  if (!t) return "";

  // صيغة 24 ساعة HH:MM → تحويل لعرض عربي «H:MM م/ص»
  const hhmm = t.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const hour = Number(hhmm[1]);
    const minute = Number(hhmm[2]);
    const period = hour >= 12 ? "م" : "ص";
    const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const m = minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`;
    return `${h}${m} ${period}`;
  }

  // نصوص أوقات الصلاة
  if (/مغرب/u.test(t)) return "بعد المغرب";
  if (/فجر/u.test(t))  return "بعد الفجر";
  if (/عصر/u.test(t))  return "بعد العصر";
  if (/ظهر/u.test(t))  return "بعد الظهر";
  if (/عشاء/u.test(t)) return "بعد العشاء";
  if (/الصباح|صباح/u.test(t)) return "صباحاً";
  if (/مساء/u.test(t)) return "مساءً";
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

// Prayer roots (without definite article) for robust matching
const PRAYER_ROOTS: Array<[RegExp, number]> = [
  [/فجر/u,  5 * 60],
  [/شروق/u, 6 * 60 + 30],
  [/ظهر/u,  12 * 60 + 15],
  [/عصر/u,  15 * 60 + 45],
  [/مغرب/u, 18 * 60 + 30],
  [/عشاء/u, 20 * 60],
];

/** تحويل الأرقام العربية الهندية (٠-٩) إلى لاتينية للتحليل. */
function normalizeArabicDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function parseTimeToMinutes(timeRaw: string): number | null {
  const time = normalizeArabicDigits(cleanTimeText(timeRaw));
  if (!time) return null;

  // كشف مساءً/صباحاً بشكل موثوق: الاختصار «م»/«ص» لا يعمل مع \b في العربية،
  // فنطابقه كرمز مستقل (محاط بمسافة أو بداية/نهاية النص).
  const isPM = /مساء|pm/iu.test(time) || /(?:^|\s)م(?:\s|$)/u.test(time);
  const isAM = /صباح|am/iu.test(time) || /(?:^|\s)ص(?:\s|$)/u.test(time);

  const explicit = time.match(/(\d{1,2})\s*[:٫]\s*(\d{2})/u);
  if (explicit) {
    let hour = Number(explicit[1]);
    const minute = Number(explicit[2]);
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  const hourOnly = time.match(/(\d{1,2})/u);
  if (hourOnly && (isPM || isAM)) {
    let hour = Number(hourOnly[1]);
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    return hour * 60;
  }

  // Match prayer names with or without definite article "ال"
  for (const [root, minutes] of PRAYER_ROOTS) {
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
