/**
 * نص شريحة عدّاد الصلاة في الشريط العلوي — منطق عرض منفصل عن المكوّن.
 */

import { formatArabicNumber } from "@/lib/numerals";

export type PrayerChipCopyInput = {
  prayerName: string;
  /** ثوانٍ متبقية للصلاة المعروضة (تنازلي) */
  remainingSeconds: number;
  sinceSeconds: number | null;
  /** اسم الصلاة التالية الفعلية أثناء/بعد نافذة «حان وقت» */
  nextPrayerName?: string | null;
  nextRemainingSeconds?: number | null;
  /** ثوانٍ بعد الأذان تُعرض فيها «حان وقت …» */
  nowWindowSec?: number;
};

export type PrayerChipCopy = {
  /** النص المعروض داخل الشريحة */
  text: string;
  prayerName: string;
  timeText: string | null;
  isNow: boolean;
  /** أقل من ١٠ دقائق — توهّج خفيف */
  urgent: boolean;
};

/** نافذة «حان وقت» = دقيقتان */
export const PRAYER_CHIP_NOW_WINDOW_SEC = 120;

function minutesPhrase(mins: number): string {
  const n = Math.max(0, Math.round(mins));
  const d = formatArabicNumber(n);
  if (n <= 1) return "دقيقة";
  if (n === 2) return "دقيقتين";
  if (n >= 3 && n <= 10) return `${d} دقائق`;
  return `${d} دقيقة`;
}

function hoursPhrase(hours: number): string {
  const n = Math.max(0, Math.round(hours));
  const d = formatArabicNumber(n);
  if (n <= 1) return "ساعة";
  if (n === 2) return "ساعتين";
  if (n >= 3 && n <= 10) return `${d} ساعات`;
  return `${d} ساعة`;
}

/**
 * مدة الأذان بالدقائق فقط — بلا ثوانٍ.
 * أمثلة: «٢٧ دقيقة» · «ساعة و١٢ دقيقة»
 */
export function formatAdhanRemainingPhrase(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.max(safe > 0 ? 1 : 0, Math.round(safe / 60));
  if (mins < 60) return minutesPhrase(mins);
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (rem === 0) return hoursPhrase(hours);
  return `${hoursPhrase(hours)} و${minutesPhrase(rem)}`;
}

/** توافق: بلا ثوانٍ حتى لا يظهر العداد الرقمي ٢٣:٤٥ ثم ٠–٩. */
export function formatChipDuration(totalSeconds: number): string {
  return formatAdhanRemainingPhrase(totalSeconds);
}

function remainingCopy(prayerName: string, remainingSeconds: number): PrayerChipCopy {
  const name = prayerName.trim() || "الصلاة";
  const phrase = formatAdhanRemainingPhrase(remainingSeconds);
  return {
    text: `متبقي على ${name}: ${phrase}`,
    prayerName: name,
    timeText: phrase,
    isNow: false,
    urgent: remainingSeconds < 600 && remainingSeconds > 0,
  };
}

export function buildPrayerChipCopy(input: PrayerChipCopyInput): PrayerChipCopy {
  const name = input.prayerName.trim() || "الصلاة";

  /* بعد دخول الوقت: انتقل فورًا للصلاة التالية (توقيت الكويت من المصدر). */
  if (input.sinceSeconds != null && input.sinceSeconds >= 0) {
    if (
      input.nextPrayerName &&
      input.nextRemainingSeconds != null &&
      input.nextRemainingSeconds > 0
    ) {
      return remainingCopy(input.nextPrayerName, input.nextRemainingSeconds);
    }
    return {
      text: `حان وقت ${name}`,
      prayerName: name,
      timeText: null,
      isNow: true,
      urgent: false,
    };
  }

  if (input.remainingSeconds <= 0) {
    if (
      input.nextPrayerName &&
      input.nextRemainingSeconds != null &&
      input.nextRemainingSeconds > 0
    ) {
      return remainingCopy(input.nextPrayerName, input.nextRemainingSeconds);
    }
    return {
      text: `حان وقت ${name}`,
      prayerName: name,
      timeText: null,
      isNow: true,
      urgent: false,
    };
  }

  return remainingCopy(name, input.remainingSeconds);
}

/** توافق مع اختبارات/مستهلكين قدماء لـ buildPrayerTickerCopy */
export type PrayerTickerCopyInput = {
  prayerName: string;
  remainingHms: string;
  sinceSeconds: number | null;
  sinceHms: string | null;
  nowWindowSec?: number;
};

export type PrayerTickerCopy = {
  label: string;
  text: string;
  isNow: boolean;
};

/**
 * واجهة قديمة للشريط — تُحوَّل إلى صيغة الشريحة المدمجة.
 * نافذة «حان وقت» الافتراضية = دقيقتان.
 */
export function buildPrayerTickerCopy(input: PrayerTickerCopyInput): PrayerTickerCopy {
  const windowSec = input.nowWindowSec ?? PRAYER_CHIP_NOW_WINDOW_SEC;
  const name = input.prayerName.trim() || "الصلاة";

  if (input.sinceSeconds != null && input.sinceSeconds < windowSec) {
    return {
      label: "حان وقت",
      text: `حان وقت ${name}`,
      isNow: true,
    };
  }

  if (input.sinceSeconds != null && input.sinceHms) {
    return {
      label: `مضى على أذان ${name}`,
      text: input.sinceHms,
      isNow: false,
    };
  }

  return {
    label: name,
    text: input.remainingHms,
    isNow: false,
  };
}
