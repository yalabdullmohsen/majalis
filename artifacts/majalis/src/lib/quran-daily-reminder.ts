/**
 * Web/native port of Expo `Notifications.scheduleNotificationAsync`
 * daily Quran reading reminder (17:00, repeats).
 */

import { isNative } from "@/lib/capacitor-utils";
import {
  loadNotifPrefs,
  requestPermission,
  saveNotifPrefs,
  sendLocalNotification,
} from "@/lib/local-notifications";

export const QURAN_DAILY_REMINDER_HOUR = 17;
export const QURAN_DAILY_REMINDER_MINUTE = 0;
export const QURAN_DAILY_REMINDER_TITLE = "وقت القراءة 📖";
export const QURAN_DAILY_REMINDER_BODY =
  "هل تود قراءة وردك اليومي من القرآن الكريم؟";
export const QURAN_DAILY_REMINDER_TAG = "majalis-quran-daily-wird";
export const QURAN_DAILY_REMINDER_URL = "/daily-wird";
/** Stable Capacitor notification id for the daily wird reminder. */
export const QURAN_DAILY_REMINDER_NATIVE_ID = 9301;

export type ScheduleDailyReminderResult = {
  ok: boolean;
  reason?: "unsupported" | "permission" | "error";
};

/**
 * RN:
 * ```ts
 * await Notifications.scheduleNotificationAsync({
 *   content: { title: "وقت القراءة 📖", body: "هل تود قراءة وردك اليومي…" },
 *   trigger: { hour: 17, minute: 0, repeats: true },
 * });
 * ```
 */
export async function scheduleDailyReminder(): Promise<ScheduleDailyReminderResult> {
  try {
    if (isNative) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") return { ok: false, reason: "permission" };

      await LocalNotifications.cancel({
        notifications: [{ id: QURAN_DAILY_REMINDER_NATIVE_ID }],
      });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: QURAN_DAILY_REMINDER_NATIVE_ID,
            title: QURAN_DAILY_REMINDER_TITLE,
            body: QURAN_DAILY_REMINDER_BODY,
            schedule: {
              on: {
                hour: QURAN_DAILY_REMINDER_HOUR,
                minute: QURAN_DAILY_REMINDER_MINUTE,
              },
              repeats: true,
              allowWhileIdle: true,
            },
            extra: { url: QURAN_DAILY_REMINDER_URL },
          },
        ],
      });
    } else {
      if (!("Notification" in window)) return { ok: false, reason: "unsupported" };
      const perm = await requestPermission();
      if (perm !== "granted") return { ok: false, reason: "permission" };
    }

    const prefs = loadNotifPrefs();
    saveNotifPrefs({
      ...prefs,
      enabled: true,
      quranDailyReminder: true,
    });

    const { syncSmartLocalNotifications } = await import("@/lib/smart-local-notifications");
    await syncSmartLocalNotifications();
    return { ok: true };
  } catch (e) {
    console.error("خطأ في جدولة تذكير القراءة اليومي", e);
    return { ok: false, reason: "error" };
  }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    if (isNative) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.cancel({
        notifications: [{ id: QURAN_DAILY_REMINDER_NATIVE_ID }],
      });
    }
  } catch {
    /* ignore */
  }
  const prefs = loadNotifPrefs();
  saveNotifPrefs({ ...prefs, quranDailyReminder: false });
  const { syncSmartLocalNotifications } = await import("@/lib/smart-local-notifications");
  await syncSmartLocalNotifications();
}

/** Fire one reminder immediately (settings / debug). */
export function sendDailyReminderNow(): void {
  sendLocalNotification(QURAN_DAILY_REMINDER_TITLE, {
    body: QURAN_DAILY_REMINDER_BODY,
    tag: QURAN_DAILY_REMINDER_TAG,
  });
}
