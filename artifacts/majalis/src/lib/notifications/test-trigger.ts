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
  soundName?: string;
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
      console.info("[adhan-schedule]", {
        prayerName: "اختبار",
        prayerTime: new Date(Date.now() + delay).toISOString(),
        mode: "short-test",
        soundName: sound,
        notificationId: TEST_NOTIFICATION_NATIVE_ID,
        segmentIndex: 0,
      });
      return { ok: true, platform, delayMs: delay, soundName: sound };
    }

    const soundName = testNotificationSound();
    if (!("Notification" in window)) {
      return { ok: false, reason: "unsupported", platform, soundName };
    }
    if (Notification.permission !== "granted") {
      return { ok: false, reason: "permission", platform, soundName };
    }
    window.setTimeout(() => {
      sendLocalNotification(TEST_NOTIFICATION_TITLE, {
        body: TEST_NOTIFICATION_BODY,
        tag: "majalis-adhan-notif-test",
      });
    }, delay);
    return { ok: true, platform, delayMs: delay, soundName };
  } catch (e) {
    console.error("[notifications/test] failed", e);
    return {
      ok: false,
      reason: "error",
      platform,
      soundName: testNotificationSound(),
    };
  }
}

export const TEST_SEQUENTIAL_BASE_ID = 99910;
export const TEST_SEQUENTIAL_GAP_MS = 29_000;

/**
 * اختبار الأذان المتتابع: 4 إشعارات بفاصل 29ث (تجريبي — قيود iOS تنطبق).
 */
export async function fireTestSequentialAdhan(): Promise<
  TestNotificationResult & { ids?: number[] }
> {
  const platform = isNative ? "native" : "web";
  try {
    if (!isNative) {
      return { ok: false, reason: "unsupported", platform };
    }
    await ensureNotificationChannels();
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      return { ok: false, reason: "permission", platform };
    }
    const ids = [0, 1, 2, 3].map((i) => TEST_SEQUENTIAL_BASE_ID + i);
    await LocalNotifications.cancel({
      notifications: ids.map((id) => ({ id })),
    });
    const start = Date.now() + 3_000;
    const notifications = ids.map((id, i) => {
      const sound = `adhan-seq-makkah-0${i + 1}.caf`;
      const at = new Date(start + i * TEST_SEQUENTIAL_GAP_MS);
      console.info("[adhan-schedule]", {
        prayerName: "اختبار متتابع",
        prayerTime: at.toISOString(),
        mode: "sequential-test",
        soundName: sound,
        notificationId: id,
        segmentIndex: i,
      });
      return {
        id,
        title: i === 0 ? "اختبار الأذان المتتابع" : "",
        body: i === 0 ? "مقطع تجريبي ١/٤ — قد ينقطع على الصامت أو Focus" : `مقطع ${i + 1}/٤`,
        schedule: { at, allowWhileIdle: true },
        sound,
        channelId: CHANNEL_GENERAL,
        interruptionLevel: "timeSensitive" as const,
        extra: {
          url: TEST_NOTIFICATION_URL,
          kind: "adhan-seq-test",
          segmentIndex: i,
        },
      };
    });
    await LocalNotifications.schedule({ notifications });
    return { ok: true, platform, delayMs: 3_000, ids };
  } catch (e) {
    console.error("[notifications/test] sequential failed", e);
    return { ok: false, reason: "error", platform };
  }
}
