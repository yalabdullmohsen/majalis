/**
 * Web/native port of Expo `Notifications.scheduleNotificationAsync`
 * daily Quran reading reminder (17:00 / 5 PM local, repeats).
 *
 * ملاحظة منتج: الساعة 17:00 مساءً (ليس 5 صباحاً) — ورد مسائي بعد العصر.
 */

import { isNative } from "@/lib/capacitor-utils";
import {
  loadNotifPrefs,
  requestPermission,
  saveNotifPrefs,
  sendLocalNotification,
} from "@/lib/local-notifications";
import {
  CHANNEL_QURAN,
  DEFAULT_ALERT_SOUND,
  ensureNotificationChannels,
} from "@/lib/notifications/channels";

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

async function scheduleNativeDailyReminder(requestPerm: boolean): Promise<ScheduleDailyReminderResult> {
  await ensureNotificationChannels();
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const checked = await LocalNotifications.checkPermissions();
  let display = checked.display;
  if (display !== "granted" && requestPerm) {
    const req = await LocalNotifications.requestPermissions();
    display = req.display;
  }
  if (display !== "granted") return { ok: false, reason: "permission" };

  // إلغاء ثم إعادة جدولة — يمنع التكرار عند كل إقلاع.
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
        sound: DEFAULT_ALERT_SOUND,
        channelId: CHANNEL_QURAN,
        interruptionLevel: "timeSensitive",
        extra: { url: QURAN_DAILY_REMINDER_URL, kind: "quran-daily" },
      },
    ],
  });
  console.info(
    "[notifications/quran] daily reminder scheduled at",
    `${QURAN_DAILY_REMINDER_HOUR}:${String(QURAN_DAILY_REMINDER_MINUTE).padStart(2, "0")}`,
  );
  return { ok: true };
}

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
      const native = await scheduleNativeDailyReminder(true);
      if (!native.ok) return native;
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

/**
 * إعادة جدولة صامتة عند الإقلاع / تغيّر المنطقة الزمنية — لا تطلب إذناً جديداً.
 */
export async function ensureQuranDailyReminderScheduled(): Promise<ScheduleDailyReminderResult> {
  try {
    const prefs = loadNotifPrefs();
    if (!prefs.enabled || !prefs.quranDailyReminder) {
      return { ok: false, reason: "unsupported" };
    }
    if (isNative) {
      return await scheduleNativeDailyReminder(false);
    }
    const { syncSmartLocalNotifications } = await import("@/lib/smart-local-notifications");
    await syncSmartLocalNotifications();
    return { ok: true };
  } catch (e) {
    console.warn("[notifications/quran] ensure failed", e);
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
