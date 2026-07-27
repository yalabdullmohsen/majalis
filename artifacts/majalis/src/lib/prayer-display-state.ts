/**
 * منطق عرض عدّاد الصلاة بمرحلتين — قابل للاختبار ومستقل عن React.
 *
 * المرحلة 1 (elapsed): من لحظة الأذان حتى 35:00 دقيقة شاملة — عدّاد تصاعدي MM:SS
 * المرحلة 2 (remaining): بعد 35 دقيقة — عدّاد تنازلي HH:MM:SS حتى الصلاة التالية
 *
 * جميع القيم تُحسب من الوقت الحقيقي + تواريخ كاملة لمواعيد الصلاة (وليس تراكمًا داخليًا).
 */

/** الحد الأدنى من حقول الموعد اللازم للحساب (يتوافق مع PrayerSlot) */
export type PrayerSlotLike = {
  key: string;
  name: string;
  obligatory: boolean;
  time24: string;
  time: string;
  minutes: number | null;
};

export const PRAYER_ELAPSED_WINDOW_MS = 35 * 60 * 1000;
export const PRAYER_ELAPSED_WINDOW_MINUTES = 35;

const OBLIGATORY_KEYS = new Set(["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]);

export type PrayerDisplayMode = "elapsed" | "remaining";

export type PrayerDisplayLabel = "مضى على الأذان" | "الوقت المتبقي";

export type PrayerMoment = {
  slot: PrayerSlotLike;
  /** لحظة الأذان كتاريخ كامل (UTC ms يعكس ساعة المنطقة) */
  at: Date;
};

export type PrayerDisplayState = {
  mode: PrayerDisplayMode;
  /** الصلاة المعروضة في البطاقة */
  displayedPrayer: PrayerSlotLike;
  /** آخر صلاة دخل وقتها */
  currentPrayer: PrayerSlotLike;
  /** الصلاة التالية بعد الحالية */
  nextPrayer: PrayerSlotLike;
  currentPrayerAt: Date;
  nextPrayerAt: Date;
  label: PrayerDisplayLabel;
  /** null خارج مرحلة elapsed */
  elapsedSinceAdhanMs: number | null;
  /** null خارج مرحلة remaining — وفي elapsed يُحسب أيضًا للصلاة التالية إن لزم */
  remainingUntilNextPrayerMs: number | null;
  /** القيمة المعروضة (elapsed أو remaining حسب الوضع) */
  counterMs: number;
  /** MM:SS في elapsed، HH:MM:SS في remaining */
  counterText: string;
};

function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

/** تصاعدي حتى 35 دقيقة: MM:SS (مثل 07:24 و 35:00) */
export function formatElapsedMmSs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

/** تنازلي: HH:MM:SS */
export function formatRemainingHms(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value || 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * تحويل ساعة جدارية في منطقة ثابتة إلى Date.
 * Asia/Kuwait بلا توقيت صيفي (UTC+3 دائمًا).
 */
export function zonedWallTimeToDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  if (timeZone === "Asia/Kuwait") {
    return new Date(Date.UTC(year, month - 1, day, hour - 3, minute, second));
  }

  // بحث تقريبي لأي منطقة أخرى
  let guess = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let i = 0; i < 3; i++) {
    const asZoned = getZonedParts(new Date(guess), timeZone);
    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    const actualAsUtc = Date.UTC(
      asZoned.year,
      asZoned.month - 1,
      asZoned.day,
      asZoned.hour,
      asZoned.minute,
      asZoned.second,
    );
    guess += desiredAsUtc - actualAsUtc;
  }
  return new Date(guess);
}

function addCalendarDays(parts: ZonedParts, dayOffset: number, timeZone: string): ZonedParts {
  const noon = zonedWallTimeToDate(parts.year, parts.month, parts.day, 12, 0, 0, timeZone);
  const shifted = new Date(noon.getTime() + dayOffset * 86_400_000);
  return getZonedParts(shifted, timeZone);
}

/**
 * يبني خطًا زمنيًا مطلقًا: صلوات أمس + اليوم + غدًا (لتغطية العشاء→فجر).
 */
export function buildPrayerTimeline(
  prayers: PrayerSlotLike[],
  now: Date,
  timeZone = "Asia/Kuwait",
): PrayerMoment[] {
  const obligatory = prayers.filter(
    (p) => OBLIGATORY_KEYS.has(p.key) && p.minutes != null && Number.isFinite(p.minutes),
  );
  if (obligatory.length === 0) return [];

  const today = getZonedParts(now, timeZone);
  const moments: PrayerMoment[] = [];

  for (const dayOffset of [-1, 0, 1] as const) {
    const day = addCalendarDays(today, dayOffset, timeZone);
    for (const slot of obligatory) {
      const mins = slot.minutes!;
      const hour = Math.floor(mins / 60);
      const minute = mins % 60;
      moments.push({
        slot,
        at: zonedWallTimeToDate(day.year, day.month, day.day, hour, minute, 0, timeZone),
      });
    }
  }

  moments.sort((a, b) => a.at.getTime() - b.at.getTime());
  return moments;
}

/**
 * يحسب حالة العرض من الوقت الحقيقي ومواقيت الصلاة.
 * @returns null إن لم تتوفر مواقيت صالحة
 */
export function computePrayerDisplayState(
  prayers: PrayerSlotLike[],
  now: Date = new Date(),
  timeZone = "Asia/Kuwait",
): PrayerDisplayState | null {
  const timeline = buildPrayerTimeline(prayers, now, timeZone);
  if (timeline.length < 2) return null;

  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) return null;

  let currentIdx = -1;
  for (let i = 0; i < timeline.length; i++) {
    if (timeline[i].at.getTime() <= nowMs) currentIdx = i;
    else break;
  }

  // قبل أول لحظة في الخط (نادر مع -1 يوم) — اعتبر الصلاة التالية هي الأولى
  if (currentIdx < 0) {
    const next = timeline[0];
    const remainingUntilNextPrayerMs = Math.max(0, next.at.getTime() - nowMs);
    return {
      mode: "remaining",
      displayedPrayer: next.slot,
      currentPrayer: next.slot,
      nextPrayer: next.slot,
      currentPrayerAt: next.at,
      nextPrayerAt: next.at,
      label: "الوقت المتبقي",
      elapsedSinceAdhanMs: null,
      remainingUntilNextPrayerMs,
      counterMs: remainingUntilNextPrayerMs,
      counterText: formatRemainingHms(remainingUntilNextPrayerMs),
    };
  }

  if (currentIdx >= timeline.length - 1) {
    // لا صلاة تالية في النافذة — وسّع غدًا (يُفترض وجود +1)
    return null;
  }

  const current = timeline[currentIdx];
  const next = timeline[currentIdx + 1];
  const elapsedSinceAdhanMs = Math.max(0, nowMs - current.at.getTime());
  const remainingUntilNextPrayerMs = Math.max(0, next.at.getTime() - nowMs);

  // شامل 35:00 — بعد ثانية واحدة فقط ننتقل للمرحلة التالية
  if (elapsedSinceAdhanMs <= PRAYER_ELAPSED_WINDOW_MS) {
    return {
      mode: "elapsed",
      displayedPrayer: current.slot,
      currentPrayer: current.slot,
      nextPrayer: next.slot,
      currentPrayerAt: current.at,
      nextPrayerAt: next.at,
      label: "مضى على الأذان",
      elapsedSinceAdhanMs,
      remainingUntilNextPrayerMs,
      counterMs: elapsedSinceAdhanMs,
      counterText: formatElapsedMmSs(elapsedSinceAdhanMs),
    };
  }

  return {
    mode: "remaining",
    displayedPrayer: next.slot,
    currentPrayer: current.slot,
    nextPrayer: next.slot,
    currentPrayerAt: current.at,
    nextPrayerAt: next.at,
    label: "الوقت المتبقي",
    elapsedSinceAdhanMs: null,
    remainingUntilNextPrayerMs,
    counterMs: remainingUntilNextPrayerMs,
    counterText: formatRemainingHms(remainingUntilNextPrayerMs),
  };
}
