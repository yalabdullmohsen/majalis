/**
 * حساب الوقت المتبقي للدروس — توقيت الكويت Asia/Kuwait (UTC+3)
 * ---------------------------------------------------------------
 * الإصلاح الجذري: الحساب يعتمد دائماً على يوم الدرس + وقته + التاريخ الحالي الفعلي
 * لا يُعتمد على الوقت وحده، ولا على القيم المُخزّنة مسبقاً
 */

import { toLatinDigits, toArabicIndicDigits } from "@/lib/numerals";

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

  // نصوص أوقات الصلاة — الأخص أولاً (عصر قبل فجر)
  if (/مغرب/u.test(t)) return "بعد المغرب";
  if (/عصر/u.test(t))  return "بعد العصر";
  if (/ظهر/u.test(t))  return "بعد الظهر";
  if (/عشاء/u.test(t)) return "بعد العشاء";
  if (/فجر/u.test(t))  return "بعد الفجر";
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

/** هل يقع الختم في نفس اليوم المدني الكويتي؟ */
export function isSameKuwaitDay(ms: number, nowMs = Date.now()): boolean {
  const a = getKuwaitClock(new Date(ms));
  const b = getKuwaitClock(new Date(nowMs));
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** هل الموعد غداً بتوقيت الكويت؟ */
export function isKuwaitTomorrow(ms: number, nowMs = Date.now()): boolean {
  const tomorrowProbe = getKuwaitClock(new Date(nowMs)).dayStartMs + 36 * 3_600_000;
  return isSameKuwaitDay(ms, tomorrowProbe);
}

/**
 * بداية الأسبوع الكويتي: السبت 00:00 Asia/Kuwait.
 * weekday: 0 أحد … 6 سبت.
 */
export function kuwaitWeekStartMs(ms: number): number {
  const clock = getKuwaitClock(new Date(ms));
  const daysFromSaturday = (clock.weekday + 1) % 7;
  return clock.dayStartMs - daysFromSaturday * 86_400_000;
}

/** هل الختم في نفس الأسبوع المدني الكويتي (سبت–جمعة)؟ */
export function isSameKuwaitWeek(ms: number, nowMs = Date.now()): boolean {
  return kuwaitWeekStartMs(ms) === kuwaitWeekStartMs(nowMs);
}

// ترتيب مطابقة الصلوات — يُقرأ وقتها من effectivePrayerMinutes (كاش حي أولاً)
const PRAYER_ROOT_KEYS: Array<[RegExp, string]> = [
  [/شروق/u,  "الشروق"],
  [/ظهر/u,   "الظهر"],
  [/عصر/u,   "العصر"],
  [/مغرب/u,  "المغرب"],
  [/عشاء/u,  "العشاء"],
  [/فجر/u,   "الفجر"], // أخيراً حتى لا يُخلط «بعد العصر» بالفجر
];

/** تحويل الأرقام العربية-الهندية (٠-٩) إلى لاتينية. */
function normalizeArabicDigits(s: string): string {
  return toLatinDigits(s);
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

/**
 * مدة الدرس الافتراضية (دقيقة) — نافذة «جارٍ الآن».
 * ساعتان من البداية ما لم يُحدَّد وقت انتهاء صريح في نص الوقت.
 */
export const LESSON_DURATION_MIN = 120;

export type LessonTimeWindow = {
  /** دقائق من منتصف الليل لوقت البدء */
  startMin: number;
  /** دقائق من منتصف الليل لوقت الانتهاء (قد تتجاوز 1440 إن امتد لليوم التالي) */
  endMin: number;
  /** هل وُجد وقت انتهاء صريح في النص؟ */
  hasExplicitEnd: boolean;
};

/**
 * يستخرج نافذة الدرس من نص الوقت.
 * إن وُجد مدى صريح («4:00 م - 6:00 م»، «من العصر إلى المغرب»، «حتى 8 م») يُلتزَم به،
 * وإلا فالنافذة = البدء + ساعتان.
 */
export function resolveLessonTimeWindow(timeRaw: string): LessonTimeWindow | null {
  const cleaned = normalizeArabicDigits(cleanTimeText(timeRaw));
  if (!cleaned) return null;

  // مدى صريح: بداية … نهاية (شرطة / إلى / حتى) — مع إبقاء صيغ الصلاة أحادية الكلمة سليمة
  const rangeParts = cleaned.split(/\s*(?:-|–|—|إلى|حت[ىي])\s+/u).map((p) => p.trim()).filter(Boolean);
  if (rangeParts.length >= 2) {
    const startPart = rangeParts[0].replace(/^من\s+/u, "").trim();
    const endPart = rangeParts[1].trim();
    const startMin = parseTimeToMinutes(startPart);
    const endMinRaw = parseTimeToMinutes(endPart);
    if (startMin != null && endMinRaw != null) {
      let endMin = endMinRaw;
      if (endMin <= startMin) endMin += 24 * 60; // يمتد لما بعد منتصف الليل
      return { startMin, endMin, hasExplicitEnd: true };
    }
  }

  const startMin = parseTimeToMinutes(cleaned);
  if (startMin == null) return null;
  return {
    startMin,
    endMin: startMin + LESSON_DURATION_MIN,
    hasExplicitEnd: false,
  };
}

/** نهاية نافذة «جارٍ الآن» بالدقائق من منتصف الليل لليوم الحالي */
export function lessonLiveEndMinutes(time: string): number | null {
  const win = resolveLessonTimeWindow(time);
  return win ? win.endMin : null;
}

export function computeNextOccurrenceMs(day: string, time: string, now = new Date()): number {
  // دعم الأيام المتعددة: مفصولة بـ ، أو / أو " و " — يُعاد أقرب تكرار قادم
  if (/[،/]/.test(day) || / و /.test(day)) {
    const days = day.split(/[،/]| و /).map(d => d.trim()).filter(Boolean);
    if (days.length > 1) {
      const occurrences = days.map(d => computeNextOccurrenceMs(d, time, now));
      return Math.min(...occurrences);
    }
  }

  const targetDay = resolveDayIndex(day);
  if (targetDay == null) {
    // يوم غير معروف → إعادة قيمة بعيدة
    return now.getTime() + 365 * 24 * 60 * 60_000;
  }

  const clock = getKuwaitClock(now);
  const win = resolveLessonTimeWindow(time);
  const timeMinutes = win?.startMin ?? effectivePrayerMinutes("المغرب");
  const liveEndMin = win?.endMin ?? timeMinutes + LESSON_DURATION_MIN;
  const nowMinutes = clock.hour * 60 + clock.minute;

  let daysUntil = (targetDay - clock.weekday + 7) % 7;

  // إذا كان الدرس اليوم ومرّ وقت البدء: أبقِ تكرار اليوم أثناء نافذة «جارٍ الآن»
  // (ساعتان أو حتى وقت الانتهاء الصريح) — لا تقفز للأسبوع القادم أثناء الحصة.
  if (daysUntil === 0 && nowMinutes >= liveEndMin) {
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
 * هل يوم الدرس هو يوم اليوم الحالي في الكويت؟
 * تعيد true لكل دروس يوم اليوم — سواء مرّ وقتها أم لا.
 * تُستخدَم لإبراز دروس اليوم كاملةً في الواجهة.
 */
export function isLessonThisDay(day: string, now = new Date()): boolean {
  const target = resolveDayIndex(day);
  if (target == null) return false;
  return target === getKuwaitClock(now).weekday;
}

/**
 * هل مرّ وقت الدرس اليوم؟
 */
export function isLessonTimePassedToday(day: string, time: string, now = new Date()): boolean {
  const targetDay = resolveDayIndex(day);
  if (targetDay == null) return false;
  const clock       = getKuwaitClock(now);
  const timeMinutes = parseTimeToMinutes(time) ?? PRAYER_TIME_MINUTES.المغرب;
  const nowMinutes  = clock.hour * 60 + clock.minute;
  return targetDay === clock.weekday && nowMinutes >= timeMinutes;
}

/**
 * هل يوم+وقت الدرس قابلان للتأكيد قبل إظهار «جارٍ الآن»؟
 * بلا يوم معروف أو بلا نافذة وقت قابلة للتحليل → لا شارة حيّة (تجنّب الادعاء بلا بيانات).
 */
export function hasConfirmedLessonSchedule(day: string, time: string): boolean {
  if (!String(day || "").trim() || !String(time || "").trim()) return false;
  if (resolveDayIndex(day) == null) return false;
  return resolveLessonTimeWindow(time) != null;
}

/**
 * هل الدرس قائم الآن؟
 * النافذة: من وقت البدء حتى وقت الانتهاء الصريح، وإلا ساعتان من البداية.
 * يُشترَط جدول مؤكد (يوم + وقت قابل للتحليل) — وإلا false.
 */
export function isLessonInProgress(day: string, time: string, now = new Date()): boolean {
  if (!hasConfirmedLessonSchedule(day, time)) return false;
  const targetDay = resolveDayIndex(day);
  if (targetDay == null) return false;
  const clock = getKuwaitClock(now);
  if (clock.weekday !== targetDay) return false;
  const win = resolveLessonTimeWindow(time);
  if (!win) return false;
  const nowMinutes = clock.hour * 60 + clock.minute;
  // امتداد لما بعد منتصف الليل: endMin قد يكون ≥ 1440
  if (win.endMin > 24 * 60) {
    return nowMinutes >= win.startMin || nowMinutes < (win.endMin - 24 * 60);
  }
  return nowMinutes >= win.startMin && nowMinutes < win.endMin;
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
 * صيغة الموعد الموحّدة للعرض:
 * اليوم + ميلادي كامل + هجري بين قوسين + الوقت + «توقيت الكويت».
 * لا صيغ مختصرة ملتبسة مثل 7/5–7/8.
 */
export function formatLessonAppointmentLine(input: {
  day?: string | null;
  time?: string | null;
  gregorianDate?: string | null;
  hijriDate?: string | null;
  uncertain?: boolean;
}): string {
  const parts: string[] = [];
  const day = (input.day || "").trim();
  const greg = (input.gregorianDate || "").trim();
  const hijri = (input.hijriDate || "").trim();
  const time = cleanTimeText(input.time || "");

  // إن كان الميلادي يبدأ باسم اليوم فلا نكرّر day منفصلاً
  if (greg) {
    parts.push(hijri ? `${greg} (${hijri})` : greg);
  } else if (day) {
    parts.push(day);
  }

  if (time) parts.push(time);
  if (parts.length) parts.push("توقيت الكويت");

  let line = parts.join(" · ");
  if (input.uncertain) {
    line = line ? `${line} · موعد غير مؤكد` : "موعد غير مؤكد";
  }
  return line;
}

/**
 * تحويل الفارق الزمني إلى نص عربي واضح — «بعد ساعة/يوم/يومين/3 أيام» بلا «قادم».
 */
export function formatRelativeTime(targetMs: number, now = Date.now()): string {
  const diffMs = targetMs - now;

  if (diffMs <= 0)          return "انتهى";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes <= 2)         return "الآن";
  if (minutes === 2)        return "بعد دقيقتين";
  if (minutes < 60) {
    if (minutes <= 10)      return toArabicIndicDigits(`بعد ${minutes} دقائق`);
    return                  toArabicIndicDigits(`بعد ${minutes} دقيقة`);
  }
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (hours < 24 || isSameKuwaitDay(targetMs, now)) {
    const hStr = hours === 1 ? "ساعة" : hours === 2 ? "ساعتين" : `${Math.max(hours, 1)} ساعات`;
    if (remMin === 0) return toArabicIndicDigits(`بعد ${hStr}`);
    if (hours >= 24) return "اليوم";
    return toArabicIndicDigits(`بعد ${hStr} و${remMin} دقيقة`);
  }

  if (isKuwaitTomorrow(targetMs, now)) return "غداً";

  const days = Math.floor(minutes / (24 * 60));
  if (days === 1) return "بعد يوم";
  if (days === 2) return "بعد يومين";
  if (days === 3) return toArabicIndicDigits("بعد 3 أيام");
  return toArabicIndicDigits(`بعد ${days} أيام`);
}

/**
 * هل الوقت نص صلاة نسبي («بعد العصر») بلا ساعة رقمية صريحة؟
 * العدّ التنازلي «بعد ساعة» لا يُعرض لهذه الصيغ إلا مع timestamp مؤكد.
 */
export function isPrayerRelativeTime(time: string): boolean {
  const t = cleanTimeText(time);
  if (!t) return false;
  if (/\d{1,2}\s*[:٫]\s*\d{2}/u.test(t)) return false;
  if (/\d{1,2}/u.test(t) && /(?:^|\s)[صم](?:\s|$)|صباح|مساء|am|pm/iu.test(t)) return false;
  return PRAYER_ROOT_KEYS.some(([root]) => root.test(t));
}

/**
 * الوصف الموجز لحالة الدرس.
 * - يوم+وقت صلاة نسبي بلا timestamp مؤكد → النص الأصلي («بعد العصر») لا «بعد ساعة».
 * - «بعد يوم · فجراً» فقط إن كان الوقت فجراً صريحاً.
 */
export function formatRelativeTimeDetailed(
  targetMs: number,
  time: string,
  now = Date.now(),
  opts?: { confirmedAbsolute?: boolean },
): string {
  const basic = formatRelativeTime(targetMs, now);
  const short = formatShortLessonTime(time) || cleanTimeText(time);

  if (!opts?.confirmedAbsolute && isPrayerRelativeTime(time)) {
    if (basic === "انتهى" || basic === "الآن") return basic;
    const hours = (targetMs - now) / 3_600_000;
    if (hours < 24) return short || basic;
    if (basic.startsWith("بعد") && short) return `${basic} · ${short}`;
    return short || basic;
  }

  if (basic === "بعد يوم" && /فجر/u.test(time) && !/عصر/u.test(time)) {
    return "بعد يوم · فجراً";
  }

  return basic;
}

export function isOccurrencePast(day: string, time: string, recurring = true, now = new Date()): boolean {
  if (!day) return false;
  const targetDay   = resolveDayIndex(day);
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

