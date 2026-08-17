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

/**
 * تنسيق المدة للشريحة:
 * - أكثر من ساعة ← «س:دد» بلا ثوانٍ
 * - أقل من ساعة ← «دد:ثث»
 */
export function formatChipDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return formatArabicNumber(`${hours}:${String(minutes).padStart(2, "0")}`);
  }
  return formatArabicNumber(
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  );
}

export function buildPrayerChipCopy(input: PrayerChipCopyInput): PrayerChipCopy {
  const windowSec = input.nowWindowSec ?? PRAYER_CHIP_NOW_WINDOW_SEC;
  const name = input.prayerName.trim() || "الصلاة";

  if (input.sinceSeconds != null && input.sinceSeconds < windowSec) {
    return {
      text: `حان وقت ${name}`,
      prayerName: name,
      timeText: null,
      isNow: true,
      urgent: false,
    };
  }

  /* بعد نافذة الدخول: انتقل للصلاة التالية إن وُجدت */
  if (
    input.sinceSeconds != null &&
    input.sinceSeconds >= windowSec &&
    input.nextPrayerName &&
    input.nextRemainingSeconds != null
  ) {
    const nextName = input.nextPrayerName.trim() || "الصلاة";
    const timeText = formatChipDuration(input.nextRemainingSeconds);
    return {
      text: `${nextName} ${timeText}`,
      prayerName: nextName,
      timeText,
      isNow: false,
      urgent: input.nextRemainingSeconds < 600,
    };
  }

  const timeText = formatChipDuration(input.remainingSeconds);
  return {
    text: `${name} ${timeText}`,
    prayerName: name,
    timeText,
    isNow: false,
    urgent: input.remainingSeconds < 600 && input.remainingSeconds > 0,
  };
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
