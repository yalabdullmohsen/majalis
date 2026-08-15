/**
 * إطلاق إشعار تجريبي للتحقق من الصوت/البانر/الحمولة على الجهاز الحقيقي.
 * الافتراضي: بعد 15 ثانية (مناسب لاختبار قفل الشاشة/الخلفية).
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
  resolveAdhanStyleNotificationSound,
} from "@/lib/prayer-notification-sounds";
import { loadAdhanPrefs, getEffectiveMuezzinId } from "@/lib/adhan-preferences";

export const TEST_NOTIFICATION_NATIVE_ID = 99901;
export const TEST_NOTIFICATION_TITLE = "اختبار إشعار الأذان";
export const TEST_NOTIFICATION_BODY =
  "إن رأيت هذا التنبيه فالصوت والبanner يعملان. على iOS الصوت قصير ≤٣٠ث.";
export const TEST_NOTIFICATION_URL = "/adhan-settings";
/** تأخير الاختبار بالمللي ثانية — 15 ثانية كما في متطلبات TestFlight. */
export const TEST_NOTIFICATION_DELAY_MS = 15_000;

function testNotificationSound(): string {
  if (!PRAYER_CUSTOM_SOUNDS_ENABLED) return DEFAULT_ALERT_SOUND;
  try {
    const prefs = loadAdhanPrefs();
    const muezzinId = getEffectiveMuezzinId(prefs, "fajr") || prefs.defaultMuezzinId || "makkah";
    return resolveAdhanStyleNotificationSound(muezzinId);
  } catch {
    return DEFAULT_ALERT_SOUND;
  }
}

export type TestNotificationResult = {
  ok: boolean;
  reason?: "permission" | "unsupported" | "error";
  platform: "native" | "web";
  soundName?: string;
  fireAtIso?: string;
};

/** يُجدوِل إشعاراً بعد 15ث على الأصل، أو يطلق Web Notification فوراً. */
export async function fireTestLocalNotification(
  opts?: { delayMs?: number },
): Promise<TestNotificationResult> {
  const platform = isNative ? "native" : "web";
  const delayMs = opts?.delayMs ?? TEST_NOTIFICATION_DELAY_MS;
  const soundName = testNotificationSound();
  try {
    if (isNative) {
      await ensureNotificationChannels();
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        console.warn("[notifications/test] permission not granted:", perm.display);
        return { ok: false, reason: "permission", platform, soundName };
      }
      await LocalNotifications.cancel({
        notifications: [{ id: TEST_NOTIFICATION_NATIVE_ID }],
      });
      const fireAt = new Date(Date.now() + delayMs);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: TEST_NOTIFICATION_NATIVE_ID,
            title: TEST_NOTIFICATION_TITLE,
            body: TEST_NOTIFICATION_BODY,
            schedule: {
              at: fireAt,
              allowWhileIdle: true,
            },
            sound: soundName,
            channelId: CHANNEL_GENERAL,
            interruptionLevel: "timeSensitive",
            extra: {
              url: TEST_NOTIFICATION_URL,
              kind: "adhan-test",
            },
          },
        ],
      });
      console.info("[notifications/test] native test scheduled", {
        notificationId: TEST_NOTIFICATION_NATIVE_ID,
        soundName,
        delayMs,
        fireAt: fireAt.toISOString(),
      });
      return { ok: true, platform, soundName, fireAtIso: fireAt.toISOString() };
    }

    if (!("Notification" in window)) {
      return { ok: false, reason: "unsupported", platform, soundName };
    }
    if (Notification.permission !== "granted") {
      return { ok: false, reason: "permission", platform, soundName };
    }
    sendLocalNotification(TEST_NOTIFICATION_TITLE, {
      body: TEST_NOTIFICATION_BODY,
      tag: "majalis-notif-test",
    });
    return { ok: true, platform, soundName };
  } catch (e) {
    console.error("[notifications/test] failed", e);
    return { ok: false, reason: "error", platform, soundName };
  }
}
