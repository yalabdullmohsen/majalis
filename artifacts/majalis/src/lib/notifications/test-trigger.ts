/**
 * إطلاق إشعار تجريبي فوري للتحقق من الصوت/البانر/الحمولة على الجهاز الحقيقي.
 */
import { isNative } from "@/lib/capacitor-utils";
import { sendLocalNotification } from "@/lib/local-notifications";
import {
  CHANNEL_GENERAL,
  DEFAULT_ALERT_SOUND,
  ensureNotificationChannels,
} from "@/lib/notifications/channels";

export const TEST_NOTIFICATION_NATIVE_ID = 99901;
export const TEST_NOTIFICATION_TITLE = "اختبار إشعار المجلس";
export const TEST_NOTIFICATION_BODY =
  "إن رأيت هذا التنبيه فالصوت والبanner والحمولة تعمل على الجهاز.";
export const TEST_NOTIFICATION_URL = "/notification-settings";

export type TestNotificationResult = {
  ok: boolean;
  reason?: "permission" | "unsupported" | "error";
  platform: "native" | "web";
};

/** يُجدوِل إشعاراً خلال ~1.5ث على الأصل، أو يطلق Web Notification فوراً. */
export async function fireTestLocalNotification(): Promise<TestNotificationResult> {
  const platform = isNative ? "native" : "web";
  try {
    if (isNative) {
      await ensureNotificationChannels();
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        console.warn("[notifications/test] permission not granted:", perm.display);
        return { ok: false, reason: "permission", platform };
      }
      await LocalNotifications.cancel({
        notifications: [{ id: TEST_NOTIFICATION_NATIVE_ID }],
      });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: TEST_NOTIFICATION_NATIVE_ID,
            title: TEST_NOTIFICATION_TITLE,
            body: TEST_NOTIFICATION_BODY,
            schedule: {
              at: new Date(Date.now() + 1500),
              allowWhileIdle: true,
            },
            sound: DEFAULT_ALERT_SOUND,
            channelId: CHANNEL_GENERAL,
            interruptionLevel: "timeSensitive",
            extra: {
              url: TEST_NOTIFICATION_URL,
              kind: "test",
            },
          },
        ],
      });
      console.info("[notifications/test] native test scheduled (+1.5s)");
      return { ok: true, platform };
    }

    if (!("Notification" in window)) {
      return { ok: false, reason: "unsupported", platform };
    }
    if (Notification.permission !== "granted") {
      return { ok: false, reason: "permission", platform };
    }
    sendLocalNotification(TEST_NOTIFICATION_TITLE, {
      body: TEST_NOTIFICATION_BODY,
      tag: "majalis-notif-test",
    });
    return { ok: true, platform };
  } catch (e) {
    console.error("[notifications/test] failed", e);
    return { ok: false, reason: "error", platform };
  }
}
