/**
 * حساب الوقت المتبقي للدروس — توقيت الكويت Asia/Kuwait (UTC+3)
 * ---------------------------------------------------------------
 * الإصلاح الجذري: الحساب يعتمد دائماً على يوم الدرس + وقته + التاريخ الحالي الفعلي
 * لا يُعتمد على الوقت وحده، ولا على القيم المُخزّنة مسبقاً
 */

export const KUWAIT_TZ = "Asia/Kuwait";

/** Kuwait offset in minutes: +3h = +180 min */
const KUWAIT_OFFSET_MIN = 3 * 60;

export const DAY_INDEX: Record<string, number> = {
  الأحد:    0,
  الاثنين:  1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الخميس:   4,
  الجمعة:   5,
  السبت:    6,
};

const EN_WEEKDAY_TO_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

/**
 * أوقات الصلاة الافتراضية — متوسطات سنوية دقيقة للكويت.
 * تُستبدَل تلقائياً بالأوقات الفعلية من API عبر setPrayerTimesCache().
 *
 * ملاحظة: القيم القديمة (الفجر 4:15، العصر 15:30، المغرب 18:30) كانت قاصرة
 * في الصيف — الصيف الكويتي يؤخّر العصر لـ16:35+ والمغرب لـ19:10+.
 */
const PRAYER_TIME_MINUTES: Record<string, number> = {
  الفجر:   4 * 60 + 20,   // 4:20 ص متوسط سنوي
  الشروق:  5 * 60 + 40,   // 5:40 ص
  الظهر:  12 * 60 +  5,   // 12:05 م
  العصر:  16 * 60 +  5,   // 4:05 م (متوسط حنفي+شافعي سنوي في الكويت)
  المغرب: 18 * 60 + 45,   // 6:45 م (متوسط سنوي)
  العشاء: 20 * 60 + 10,   // 8:10 م (متوسط سنوي)
};

/**
 * كاش الأوقات الفعلية من API — يُحدَّث عند جلب مواقيت الصلاة.
 * المفاتيح: "الفجر" | "الشروق" | "الظهر" | "العصر" | "المغرب" | "العشاء"
 */
let _livePrayerCache: Record<string, number> | null = null;

/** يُستدعى من مكون مواقيت الصلاة عند نجاح الجلب */
export function setPrayerTimesCache(times: Record<string, number>): void {
  _livePrayerCache = { ...times };
}

/** يُعيد وقت الصلاة: من الكاش الحي أولاً، ثم الافتراضي */
function effectivePrayerMinutes(key: string): number {
  return _livePrayerCache?.[key] ?? PRAYER_TIME_MINUTES[key];
}

export type KuwaitClock = {
  year:    number;
  month:   number;  // 1-12
  day:     number;  // 1-31
  weekday: number;  // 0=أحد … 6=سبت
  hour:    number;
  minute:  number;
  /** Timestamp of midnight Kuwait local time (start of day) */
  dayStartMs: number;
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
    const hour   = Number(hhmm[1]);
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
  if (/مساء/u.test(t))         return "مساءً";
  return t.length > 24 ? `${t.slice(0, 22).trim()}…` : t;
}

/**
 * استخرج مكوّنات التاريخ والوقت في توقيت الكويت.
 * يُحسب `dayStartMs` بدقة: منتصف ليل الكويت (00:00 KWT) بالـ UTC.
 */
export function getKuwaitClock(date = new Date()): KuwaitClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KUWAIT_TZ,
    year:     "numeric",
    month:    "2-digit",
    day:      "2-digit",
    weekday:  "long",
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   false,
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  const weekdayName = parts.find((p) => p.type === "weekday")?.value ?? "Sunday";

  // معالجة ساعة الـ24 (بعض المتصفحات تُعيد 24 عند منتصف الليل)
  const rawHour = read("hour");
  const hour    = rawHour === 24 ? 0 : rawHour;
  const year    = read("year");
  const month   = read("month");
  const day     = read("day");

  // منتصف ليل الكويت بالـ UTC = منتصف الليل الكويتي − 3 ساعات
  const dayStartMs = Date.UTC(year, month - 1, day, 0, 0, 0) - KUWAIT_OFFSET_MIN * 60_000;

  return {
    year, month, day,
    weekday: EN_WEEKDAY_TO_INDEX[weekdayName] ?? 0,
    hour, minute: read("minute"),
    dayStartMs,
  };
}

// ترتيب مطابقة الصلوات — يُقرأ وقتها من effectivePrayerMinutes (كاش حي أولاً)
const PRAYER_ROOT_KEYS: Array<[RegExp, string]> = [
  [/فجر/u,   "الفجر"],
  [/شروق/u,  "الشروق"],
  [/ظهر/u,   "الظهر"],
  [/عصر/u,   "العصر"],
  [/مغرب/u,  "المغرب"],
  [/عشاء/u,  "العشاء"],
];

/** تحويل الأرقام العربية-الهندية (٠-٩) إلى لاتينية. */
function normalizeArabicDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/**
 * تحليل نص الوقت وإعادة عدد الدقائق من منتصف الليل (0-1439).
 * يدعم: "4:30 م", "16:30", "بعد المغرب", "قبل الفجر", ...
 */
export function parseTimeToMinutes(timeRaw: string): number | null {
  const time = normalizeArabicDigits(cleanTimeText(timeRaw));
  if (!time) return null;

  const isPM = /مساء|pm/iu.test(time) || /(?:^|\s)م(?:\s|$)/u.test(time);
  const isAM = /صباح|am/iu.test(time) || /(?:^|\s)ص(?:\s|$)/u.test(time);

  // HH:MM or H:MM
  const explicit = time.match(/(\d{1,2})\s*[:٫]\s*(\d{2})/u);
  if (explicit) {
    let hour   = Number(explicit[1]);
    const min  = Number(explicit[2]);
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    // ساعات 0-23 فقط
    hour = Math.max(0, Math.min(23, hour));
    return hour * 60 + Math.min(59, min);
  }

  // رقم ساعة فقط مع م/ص
  const hourOnly = time.match(/(\d{1,2})/u);
  if (hourOnly && (isPM || isAM)) {
    let hour = Number(hourOnly[1]);
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    return Math.max(0, Math.min(23, hour)) * 60;
  }

  // أسماء الصلوات — يستخدم الأوقات الفعلية من API إن وُجدت
  for (const [root, prayerKey] of PRAYER_ROOT_KEYS) {
    if (root.test(time)) {
      const baseMinutes = effectivePrayerMinutes(prayerKey);
      if (/بعد/u.test(time)) return baseMinutes + 20;
      if (/قبل/u.test(time)) return Math.max(0, baseMinutes - 60);
      return baseMinutes;
    }
  }

  return null;
}

/**
 * بناء طابع زمني UTC لـ (today + dayOffset) عند الدقيقة (minutes) بتوقيت الكويت.
 * الحساب الصحيح: ابدأ من منتصف الليل الكويتي (dayStartMs) ثم أضف الدقائق.
 */
function kuwaitDateAt(dayOffset: number, minutes: number, base = new Date()): Date {
  const clock = getKuwaitClock(base);
  // dayStartMs = midnight Kuwait on base's Kuwait date
  // dayOffset أيام بعدها = dayStartMs + dayOffset * 86400000
  const targetDayStartMs = clock.dayStartMs + dayOffset * 24 * 60 * 60_000;
  return new Date(targetDayStartMs + minutes * 60_000);
}

/**
 * حساب الطابع الزمني للمرة القادمة لدرس يُقام يوم (day) في وقت (time) بتوقيت الكويت.
 *
 * القواعد:
 * 1. إذا كان الدرس اليوم ووقته لم يمرّ بعد → يُعرض اليوم.
 * 2. إذا كان الدرس اليوم ووقته مرّ (ولو بدقيقة) → الأسبوع القادم (درس أسبوعي متكرر).
 * 3. إذا كان الدرس في يوم آخر → أقرب تكرار له.
 */
/**
 * تُحلِّل اسم اليوم بأي صيغة وتُعيد رقمه (0=أحد … 6=سبت)، أو null إذا لم تُعرف.
 * تدعم: أسماء عربية كاملة، أسماء إنجليزية، أرقام، همزات متنوعة، بادئة "يوم ".
 */
function resolveDayIndex(day: string): number | null {
  const d = day.trim();
  // عربي مباشر
  if (DAY_INDEX[d] != null) return DAY_INDEX[d];
  // إنجليزي
  if (EN_WEEKDAY_TO_INDEX[d] != null) return EN_WEEKDAY_TO_INDEX[d];
  // رقم صحيح 0-6
  const num = Number(d);
  if (Number.isInteger(num) && num >= 0 && num <= 6) return num;
  // إزالة بادئة "يوم " ثم إعادة المحاولة
  const stripped = d.replace(/^يوم\s+/u, "");
  if (DAY_INDEX[stripped] != null) return DAY_INDEX[stripped];
  // تطبيع الهمزات (إ/أ → ا) ثم إعادة المحاولة — يعالج "الإثنين" و"الأحد"
  const normalized = stripped.replace(/[إأ]/gu, "ا");
  if (DAY_INDEX[normalized] != null) return DAY_INDEX[normalized];
  // بحث جزئي: أول مطابقة للاسم العربي داخل النص
  for (const [name, idx] of Object.entries(DAY_INDEX)) {
    if (d.includes(name)) return idx;
  }
  return null;
}

export function computeNextOccurrenceMs(day: string, time: string, now = new Date()): number {
  // دعم الأيام المتعددة المفصولة بـ ، أو / — يُعاد أقرب تكرار قادم
  const separator = day.includes("،") ? "،" : day.includes("/") ? "/" : null;
  if (separator) {
    const days = day.split(separator).map(d => d.trim()).filter(Boolean);
    const occurrences = days.map(d => computeNextOccurrenceMs(d, time, now));
    return Math.min(...occurrences);
  }

  const targetDay = resolveDayIndex(day);
  if (targetDay == null) {
    // يوم غير معروف → إعادة قيمة بعيدة
    return now.getTime() + 365 * 24 * 60 * 60_000;
  }

  const clock        = getKuwaitClock(now);
  const timeMinutes  = parseTimeToMinutes(time) ?? effectivePrayerMinutes("المغرب");
  const nowMinutes   = clock.hour * 60 + clock.minute;

  let daysUntil = (targetDay - clock.weekday + 7) % 7;

  // إذا كان الدرس اليوم لكن وقته مرّ → انتقل للأسبوع القادم
  if (daysUntil === 0 && nowMinutes >= timeMinutes) {
    daysUntil = 7;
  }

  return kuwaitDateAt(daysUntil, timeMinutes, now).getTime();
}

/**
 * هل الدرس قائم اليوم (nextOccurrenceMs في نطاق اليوم الكويتي الحالي)؟
 */
export function isLessonToday(nextOccurrenceMs: number, now = new Date()): boolean {
  const todayClock = getKuwaitClock(now);
  const nextClock  = getKuwaitClock(new Date(nextOccurrenceMs));
  return (
    nextClock.year  === todayClock.year  &&
    nextClock.month === todayClock.month &&
    nextClock.day   === todayClock.day
  );
}

/**
 * هل مرّ وقت الدرس اليوم؟
 * يُستخدم لإخفاء الدروس المنتهية من قسم "دروس اليوم".
 */
export function isLessonTimePassedToday(day: string, time: string, now = new Date()): boolean {
  const targetDay = DAY_INDEX[day];
  if (targetDay == null) return false;
  const clock       = getKuwaitClock(now);
  const timeMinutes = parseTimeToMinutes(time) ?? PRAYER_TIME_MINUTES.المغرب;
  const nowMinutes  = clock.hour * 60 + clock.minute;
  return targetDay === clock.weekday && nowMinutes >= timeMinutes;
}

export function formatGregorianDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-KW", {
    timeZone: KUWAIT_TZ,
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  }).format(date);
}

export function formatHijriDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      timeZone: KUWAIT_TZ,
      day:   "numeric",
      month: "long",
      year:  "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

/**
 * تحويل الفارق الزمني إلى نص عربي واضح.
 *
 * الحالات:
 *  ≤ 0          → "انتهى"   (إذا مرّ ولو ثانية)
 *  ≤ 2 min      → "الآن"
 *  ≤ 59 min     → "بعد X دقيقة" / "بعد دقيقتين"
 *  < 1 h        → "بعد أقل من ساعة"
 *  1 h          → "بعد ساعة"
 *  2 h          → "بعد ساعتين"
 *  < 24 h       → "بعد X ساعات"
 *  < 48 h       → "غداً"
 *  ≤ 6 days     → "بعد X أيام"
 *  ≤ 13 days    → "الأسبوع القادم"
 *  ≤ 20 days    → "بعد أسبوعين"
 *  months       → "بعد X أشهر"
 */
export function formatRelativeTime(targetMs: number, now = Date.now()): string {
  const diffMs = targetMs - now;

  if (diffMs <= 0)          return "انتهى";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes <= 2)         return "الآن";
  if (minutes === 2)        return "بعد دقيقتين";
  if (minutes < 60) {
    if (minutes <= 10)      return `بعد ${minutes} دقائق`;
    return                  `بعد ${minutes} دقيقة`;
  }
  if (minutes < 90)         return "بعد أقل من ساعة";

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    if (hours === 1)        return "بعد ساعة";
    if (hours === 2)        return "بعد ساعتين";
    return                  `بعد ${hours} ساعات`;
  }

  const days = Math.floor(minutes / (24 * 60));
  if (days === 1)           return "غداً";
  if (days === 2)           return "بعد يومين";
  if (days <= 6)            return `بعد ${days} أيام`;
  if (days <= 13)           return "الأسبوع القادم";
  if (days <= 20)           return "بعد أسبوعين";

  const months = Math.floor(days / 30);
  if (months >= 1)          return months === 1 ? "بعد شهر" : `بعد ${months} أشهر`;
  return `بعد ${days} أيام`;
}

/**
 * الوصف الموجز لحالة الدرس، مع حالة خاصة "غداً فجراً".
 */
export function formatRelativeTimeDetailed(targetMs: number, time: string, now = Date.now()): string {
  const basic = formatRelativeTime(targetMs, now);

  // إذا كان الدرس غداً وكان وقته الفجر → "غداً فجراً"
  if (basic === "غداً" && /فجر/u.test(time)) {
    return "غداً فجراً";
  }

  return basic;
}

export function isOccurrencePast(day: string, time: string, recurring = true, now = new Date()): boolean {
  if (!day) return false;
  const targetDay   = DAY_INDEX[day];
  if (targetDay == null) return false;
  const clock       = getKuwaitClock(now);
  const timeMinutes = parseTimeToMinutes(time) ?? PRAYER_TIME_MINUTES.المغرب;
  const nowMinutes  = clock.hour * 60 + clock.minute;

  if (targetDay === clock.weekday && nowMinutes >= timeMinutes) {
    return !recurring;
  }

  const nextMs = computeNextOccurrenceMs(day, time, now);
  if (!recurring && nextMs < now.getTime()) return true;
  return false;
}

/* ──────────────────────────────────────────────────────────────
   اختبارات الوحدة الداخلية — تُنفَّذ عند استيراد الوحدة في وضع التطوير
   ────────────────────────────────────────────────────────────── */
if (import.meta.env?.DEV) {
  void (async () => {
    type Case = { label: string; day: string; time: string; nowKWT: string; expectTodayOrFuture: "today" | "future" };
    const cases: Case[] = [
      { label: "فجر السبت — من وقت العصر",   day: "السبت",    time: "بعد الفجر",  nowKWT: "2026-07-04T15:45:00+03:00", expectTodayOrFuture: "future" },
      { label: "مغرب السبت — من وقت الظهر",  day: "السبت",    time: "بعد المغرب", nowKWT: "2026-07-04T12:00:00+03:00", expectTodayOrFuture: "today" },
      { label: "درس الجمعة — من الأربعاء",    day: "الجمعة",   time: "9:00 م",     nowKWT: "2026-07-01T20:00:00+03:00", expectTodayOrFuture: "future" },
      { label: "درس اليوم نفسه — لم يمرّ",    day: "الأربعاء", time: "8:00 م",     nowKWT: "2026-07-01T18:00:00+03:00", expectTodayOrFuture: "today" },
      { label: "درس اليوم نفسه — مرّ",        day: "الأربعاء", time: "8:00 م",     nowKWT: "2026-07-01T21:00:00+03:00", expectTodayOrFuture: "future" },
      { label: "عشاء الخميس — من العصر",      day: "الخميس",   time: "بعد العشاء", nowKWT: "2026-07-02T15:30:00+03:00", expectTodayOrFuture: "today" },
      { label: "فجر يوم آخر — من منتصف الليل",day: "الجمعة",   time: "الفجر",      nowKWT: "2026-07-03T00:30:00+03:00", expectTodayOrFuture: "future" },
    ];
    let pass = 0;
    for (const c of cases) {
      const now  = new Date(c.nowKWT);
      const msVal = computeNextOccurrenceMs(c.day, c.time, now);
      const today = isLessonToday(msVal, now);
      const ok    = c.expectTodayOrFuture === "today" ? today : !today;
      if (!ok) {
        console.warn(`[lesson-time] FAIL: ${c.label} — got today=${today}`);
      } else {
        pass++;
      }
    }
    if (pass < cases.length) {
      console.warn(`[lesson-time] ${pass}/${cases.length} passed`);
    }
  })();
}
