/**
 * بصمة جدول تنبيهات الصلاة — يمنع إعادة الجدولة عند تطابق المدخلات.
 */
import type { PrayerDayTimes, PrayerNotificationPreferences } from "./types";
import { PRAYER_NOTIFICATION_KEYS } from "./types";
import { isPrayerAlertEnabled } from "./preferences";

function stableMinutes(day: PrayerDayTimes): string {
  return PRAYER_NOTIFICATION_KEYS.map((key) => {
    const slot = day.slots.find((s) => s.key === key);
    const m = slot?.minutes;
    return `${key}:${m == null ? "x" : Math.round(m)}`;
  }).join(",");
}

function enabledMask(prefs: PrayerNotificationPreferences): string {
  return PRAYER_NOTIFICATION_KEYS.map((k) => (isPrayerAlertEnabled(prefs, k) ? "1" : "0")).join("");
}

function alertStyleMask(prefs: PrayerNotificationPreferences): string {
  return PRAYER_NOTIFICATION_KEYS.map((k) => prefs.alertStyleByPrayer[k] ?? "system").join(",");
}

function voiceMask(prefs: PrayerNotificationPreferences): string {
  return PRAYER_NOTIFICATION_KEYS.map((k) => prefs.voiceIdByPrayer[k] || "-").join(",");
}

/** بصمة مستقرة: تاريخ + منطقة + طريقة + مذهب + صلوات مفعّلة + أوقات مطبّعة. */
export function buildScheduleFingerprint(
  day: PrayerDayTimes,
  prefs: PrayerNotificationPreferences,
  extra?: { preMinutes?: number; enterEnabled?: boolean; postEnabled?: boolean },
): string {
  return [
    "v2",
    day.dateISO,
    day.timeZone,
    day.methodId,
    day.madhabId,
    enabledMask(prefs),
    alertStyleMask(prefs),
    voiceMask(prefs),
    stableMinutes(day),
    `pre:${extra?.preMinutes ?? 0}`,
    `enter:${extra?.enterEnabled === false ? 0 : 1}`,
    `post:${extra?.postEnabled ? 1 : 0}`,
    `sound:${prefs.soundKind}`,
  ].join("|");
}
