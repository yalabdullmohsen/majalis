/**
 * نص شريط الصلاة العلوي — منفصل عن المكوّن لاختبارات وحدوية بلا DOM.
 */

export type PrayerTickerCopyInput = {
  prayerName: string;
  remainingHms: string;
  sinceSeconds: number | null;
  sinceHms: string | null;
  /** ثوانٍ بعد الأذان تُعرض فيها رسالة «حان الآن» */
  nowWindowSec?: number;
};

export type PrayerTickerCopy = {
  label: string;
  text: string;
  /** هل نحن في نافذة دخول الوقت */
  isNow: boolean;
};

const DEFAULT_NOW_WINDOW_SEC = 90;

export function buildPrayerTickerCopy(input: PrayerTickerCopyInput): PrayerTickerCopy {
  const windowSec = input.nowWindowSec ?? DEFAULT_NOW_WINDOW_SEC;
  const name = input.prayerName.trim() || "الصلاة";

  if (input.sinceSeconds != null && input.sinceSeconds < windowSec) {
    return {
      label: "حان الآن",
      text: `حان الآن وقت صلاة ${name}`,
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
    label: `المتبقي على صلاة ${name}`,
    text: input.remainingHms,
    isNow: false,
  };
}
