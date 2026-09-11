/**
 * تذكير احترام وقت الصلاة: من الأذان حتى ١٠ دقائق بعده.
 * رسائل قصيرة متنوعة (هدوء الجوال) بلا افتراض أن المستخدم يصلّي.
 */

import {
  NOTIFICATION_CATALOG,
  fillNotificationTemplate,
  type LocalizedNotification,
} from "@/lib/notifications/localization";

/** دقائق بقاء التذكير بعد دخول وقت الصلاة. */
export const PRAYER_RESPECT_POST_MINUTES = 10;
/** @deprecated استخدم PRAYER_RESPECT_POST_MINUTES */
export const PRAYER_RESPECT_WINDOW_MINUTES = PRAYER_RESPECT_POST_MINUTES;

export type PrayerRespectMessage = LocalizedNotification;

/** رسائل الاحترام المعتمدة (للاختبارات والمستهلكين). */
export const PRAYER_RESPECT_MESSAGES: readonly PrayerRespectMessage[] =
  NOTIFICATION_CATALOG.prayerRespect.map((tpl) => ({
    title: fillNotificationTemplate(tpl.title),
    body: fillNotificationTemplate(tpl.body),
  }));

/** هل نحن داخل نافذة التذكير بعد الأذان (٠ … ١٠ دقائق)؟ */
export function isWithinPrayerRespectWindow(elapsedSeconds: number | null | undefined): boolean {
  if (elapsedSeconds == null || !Number.isFinite(elapsedSeconds)) return false;
  if (elapsedSeconds < 0) return false;
  return elapsedSeconds <= PRAYER_RESPECT_POST_MINUTES * 60;
}

/**
 * اختيار رسالة مستقرة لنفس الصلاة في نفس اليوم، مع تدوير كل دقيقتين داخل النافذة.
 */
export function pickPrayerRespectMessage(
  prayerKey: string,
  elapsedSeconds = 0,
  dateKey = "",
): PrayerRespectMessage {
  const pool = NOTIFICATION_CATALOG.prayerRespect;
  if (!pool.length) {
    return {
      title: "وقت الصلاة",
      body: "يُستحسن وضع الجوال على الصامت.",
    };
  }
  const slot = Math.max(0, Math.floor(elapsedSeconds / 120));
  let hash = 0;
  const seed = `${dateKey}|${prayerKey}|${slot}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const tpl = pool[hash % pool.length]!;
  return {
    title: fillNotificationTemplate(tpl.title, { name: prayerKey }),
    body: fillNotificationTemplate(tpl.body, { name: prayerKey }),
  };
}
