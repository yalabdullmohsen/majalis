/**
 * تذكيرات صوتية بعبارات الذكر الثابتة (سبحان الله، الحمد لله، …).
 * على الأصل: إشعارات Capacitor يومية متكررة بصوت النظام.
 * على الويب: تُدمَج في جدول smart-local-notifications / Service Worker.
 *
 * العبارات مطابقة لأوراد التسبيح الافتراضية — لا نص مخترع.
 */

import { isNative } from "@/lib/capacitor-utils";
import { loadNotifPrefs } from "@/lib/local-notifications";
import {
  CHANNEL_GENERAL,
  DEFAULT_ALERT_SOUND,
  ensureNotificationChannels,
} from "@/lib/notifications/channels";

export const DHIKR_PHRASE_REMINDER_URL = "/tasbih";
export const DHIKR_PHRASE_REMINDER_BODY = "اذكر الله";
export const DHIKR_PHRASE_NATIVE_ID_BASE = 9401;

/** سبع عبارات معتمدة — توقيت يقظة كل ساعتين من 8 صباحًا حتى 8 مساءً. */
export const DHIKR_PHRASE_SLOTS = [
  { id: "subhanallah", phrase: "سبحان الله", hour: 8 },
  { id: "alhamdulillah", phrase: "الحمد لله", hour: 10 },
  { id: "takbir", phrase: "الله أكبر", hour: 12 },
  { id: "tahleel", phrase: "لا إله إلا الله", hour: 14 },
  { id: "salawat", phrase: "الصلاة على النبي ﷺ", hour: 16 },
  { id: "istighfar", phrase: "أستغفر الله", hour: 18 },
  { id: "hawqala", phrase: "لا حول ولا قوة إلا بالله", hour: 20 },
] as const;

export type DhikrPhraseSlot = (typeof DHIKR_PHRASE_SLOTS)[number];

export function dhikrPhraseNativeId(index: number): number {
  return DHIKR_PHRASE_NATIVE_ID_BASE + index;
}

export function dhikrPhraseTag(id: string): string {
  return `majalis-dhikr-phrase-${id}`;
}

export function allDhikrPhraseNativeIds(): Array<{ id: number }> {
  return DHIKR_PHRASE_SLOTS.map((_, i) => ({ id: dhikrPhraseNativeId(i) }));
}

export type EnsureDhikrRemindersResult = {
  ok: boolean;
  scheduled: number;
  reason?: "unsupported" | "permission" | "disabled" | "error";
};

async function cancelNativeDhikrReminders(): Promise<void> {
  if (!isNative) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: allDhikrPhraseNativeIds() });
  } catch {
    /* ignore */
  }
}

async function scheduleNativeDhikrReminders(requestPerm: boolean): Promise<EnsureDhikrRemindersResult> {
  await ensureNotificationChannels();
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const checked = await LocalNotifications.checkPermissions();
  let display = checked.display;
  if (display !== "granted" && requestPerm) {
    const req = await LocalNotifications.requestPermissions();
    display = req.display;
  }
  if (display !== "granted") return { ok: false, scheduled: 0, reason: "permission" };

  await LocalNotifications.cancel({ notifications: allDhikrPhraseNativeIds() });
  await LocalNotifications.schedule({
    notifications: DHIKR_PHRASE_SLOTS.map((slot, i) => ({
      id: dhikrPhraseNativeId(i),
      title: slot.phrase,
      body: DHIKR_PHRASE_REMINDER_BODY,
      schedule: {
        on: { hour: slot.hour, minute: 0 },
        repeats: true,
        allowWhileIdle: true,
      },
      sound: DEFAULT_ALERT_SOUND,
      channelId: CHANNEL_GENERAL,
      interruptionLevel: "active" as const,
      extra: {
        url: DHIKR_PHRASE_REMINDER_URL,
        kind: "dhikr-phrase",
        phraseId: slot.id,
      },
    })),
  });
  console.info(
    "[notifications/dhikr] scheduled",
    DHIKR_PHRASE_SLOTS.length,
    "daily phrase reminders",
  );
  return { ok: true, scheduled: DHIKR_PHRASE_SLOTS.length };
}

/**
 * إعادة جدولة صامتة عند الإقلاع / تغيّر التفضيلات — لا تطلب إذنًا جديدًا.
 */
export async function ensureDhikrPhraseRemindersScheduled(): Promise<EnsureDhikrRemindersResult> {
  try {
    const prefs = loadNotifPrefs();
    if (!prefs.enabled || !prefs.dhikrPhraseReminder) {
      await cancelNativeDhikrReminders();
      return { ok: false, scheduled: 0, reason: "disabled" };
    }
    if (isNative) {
      return await scheduleNativeDhikrReminders(false);
    }
    return { ok: true, scheduled: DHIKR_PHRASE_SLOTS.length };
  } catch (e) {
    console.warn("[notifications/dhikr] ensure failed", e);
    return { ok: false, scheduled: 0, reason: "error" };
  }
}

export async function cancelNativeDhikrPhraseReminders(): Promise<void> {
  await cancelNativeDhikrReminders();
}
