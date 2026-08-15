/**
 * إطلاق إشعار تجريبي للتحقق من الصوت/البانر/الحمولة على الجهاز الحقيقي (TestFlight).
 */
import { isNative } from "@/lib/capacitor-utils";
import { sendLocalNotification } from "@/lib/local-notifications";
import {
  CHANNEL_GENERAL,
  DEFAULT_ALERT_SOUND,
  ensureNotificationChannels,
} from "@/lib/notifications/channels";
import {
  PRAYER_CUSTOM_SOUNDS_ENABLED,
  PRAYER_SOUND_FILES,
  platformNotificationSoundName,
  resolveAdhanStyleNotificationSound,
} from "@/lib/prayer-notification-sounds";
import { loadAdhanPrefs } from "@/lib/adhan-preferences";

export const TEST_NOTIFICATION_NATIVE_ID = 99901;
export const TEST_NOTIFICATION_TITLE = "اختبار إشعار الأذان";
export const TEST_NOTIFICATION_BODY =
  "إن سمعت صوت الأذان القصير فالحزمة والإشعار يعملان على الجهاز.";
export const TEST_NOTIFICATION_URL = "/adhan-settings";

/** التأخير الافتراضي لاختبار TestFlight */
export const TEST_NOTIFICATION_DELAY_MS = 15_000;

function testNotificationSound(): string {
  if (!PRAYER_CUSTOM_SOUNDS_ENABLED) return DEFAULT_ALERT_SOUND;
  try {
    const prefs = loadAdhanPrefs();
    return resolveAdhanStyleNotificationSound(prefs.defaultMuezzinId || "makkah");
  } catch {
    return platformNotificationSoundName(PRAYER_SOUND_FILES.clear);
  }
}

export type TestNotificationResult = {
  ok: boolean;
  reason?: "permission" | "unsupported" | "error";
  platform: "native" | "web";
  delayMs?: number;
};

/** يُجدوِل إشعارًا بعد delayMs (افتراضي 15ث) على الأصل. */
export async function fireTestLocalNotification(
  delayMs: number = TEST_NOTIFICATION_DELAY_MS,
): Promise<TestNotificationResult> {
  const platform = isNative ? "native" : "web";
  const delay = Math.max(1500, delayMs);
  try {
    if (isNative) {
      await ensureNotificationChannels();
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        console.warn("[notifications/test] permission denied:", perm.display);
        return { ok: false, reason: "permission", platform, delayMs: delay };
      }
      await LocalNotifications.cancel({
        notifications: [{ id: TEST_NOTIFICATION_NATIVE_ID }],
      });
      const sound = testNotificationSound();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: TEST_NOTIFICATION_NATIVE_ID,
            title: TEST_NOTIFICATION_TITLE,
            body: TEST_NOTIFICATION_BODY,
            schedule: {
              at: new Date(Date.now() + delay),
              allowWhileIdle: true,
            },
            sound,
            channelId: CHANNEL_GENERAL,
            interruptionLevel: "timeSensitive",
            extra: {
              url: TEST_NOTIFICATION_URL,
              kind: "adhan-test",
            },
          },
        ],
      });
      console.info("[notifications/test] scheduled", { delayMs: delay, sound });
      return { ok: true, platform, delayMs: delay };
    }

    if (!("Notification" in window)) {
      return { ok: false, reason: "unsupported", platform };
    }
    if (Notification.permission !== "granted") {
      return { ok: false, reason: "permission", platform };
    }
    window.setTimeout(() => {
      sendLocalNotification(TEST_NOTIFICATION_TITLE, {
        body: TEST_NOTIFICATION_BODY,
        tag: "majalis-adhan-notif-test",
      });
    }, delay);
    return { ok: true, platform, delayMs: delay };
  } catch (e) {
    console.error("[notifications/test] failed", e);
    return { ok: false, reason: "error", platform };
  }
}
