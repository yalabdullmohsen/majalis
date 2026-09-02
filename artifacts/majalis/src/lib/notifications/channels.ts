/**
 * قنوات إشعارات أندرويد + ثوابت الصوت المشتركة مع iOS.
 * على iOS لا توجد قنوات؛ نضبط الصوت عبر `sound` و`presentationOptions` في capacitor.config.
 */
import { isNative } from "@/lib/capacitor-utils";

export const CHANNEL_PRAYER = "majalis-prayer-alerts";
export const CHANNEL_QURAN = "majalis-quran-daily";
export const CHANNEL_GENERAL = "ssunnah-general";

/** اسم ملف غير موجود → صوت النظام الافتراضي على iOS/Android 7 (انظر Capacitor docs). */
export const DEFAULT_ALERT_SOUND = "default";

let _channelsReady = false;

export async function ensureNotificationChannels(): Promise<void> {
  if (!isNative || _channelsReady) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.getPlatform() !== "android") {
      _channelsReady = true;
      return;
    }
    const channels = [
      {
        id: CHANNEL_PRAYER,
        name: "تنبيهات الصلاة",
        description: "إشعارات قبل الصلاة وعند دخول الوقت",
        importance: 5 as const,
        visibility: 1 as const,
        sound: DEFAULT_ALERT_SOUND,
        vibration: true,
      },
      {
        id: CHANNEL_QURAN,
        name: "ورد القرآن",
        description: "تذكير القراءة اليومية",
        importance: 4 as const,
        visibility: 1 as const,
        sound: DEFAULT_ALERT_SOUND,
        vibration: true,
      },
      {
        id: CHANNEL_GENERAL,
        name: "تذكيرات عامة",
        description: "تذكيرات عامة واختبارات التشخيص",
        importance: 4 as const,
        visibility: 1 as const,
        sound: DEFAULT_ALERT_SOUND,
        vibration: true,
      },
    ];
    for (const ch of channels) {
      try {
        await LocalNotifications.createChannel(ch);
      } catch (e) {
        console.warn("[notifications] createChannel failed", ch.id, e);
      }
    }
    _channelsReady = true;
    console.info("[notifications] Android channels ready");
  } catch (e) {
    console.warn("[notifications] ensureNotificationChannels failed", e);
  }
}
