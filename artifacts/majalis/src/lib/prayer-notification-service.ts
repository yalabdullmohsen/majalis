/**
 * PrayerNotificationService — واجهة موحّدة لإشعارات الصلاة (منفصلة عن In-App Audio).
 */
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  schedulePrayerNativeNotifications,
  cancelAllPrayerNativeNotifications,
  type PermissionStatus,
} from "@/lib/prayer-local-notifications";
import { dateISOInZone } from "@/lib/prayer-notification-ids";
import type { AdhanPreferences } from "@/lib/adhan-preferences";
import { loadAdhanPrefs } from "@/lib/adhan-preferences";
import { isNative } from "@/lib/capacitor-utils";

export type PrayerTimesInput = {
  fajr: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  date?: Date;
};

const PRAYER_AR: Record<keyof Omit<PrayerTimesInput, "date">, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

let lastError: string | null = null;

export async function checkNotificationPermissionStatus(): Promise<PermissionStatus> {
  return getNotificationPermissionStatus();
}

export { requestNotificationPermission };

export async function schedulePrayerNotifications(
  prayerTimes: PrayerTimesInput,
  userSettings?: AdhanPreferences,
): Promise<{ scheduled: number; error?: string }> {
  const prefs = userSettings ?? loadAdhanPrefs();
  try {
    await cancelAllPrayerNativeNotifications();
    let scheduled = 0;
    for (const key of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
      const prayerPrefs = prefs.prayers[key];
      if (!prayerPrefs?.enabled) continue;
      const at = prayerTimes[key];
      const dateISO = dateISOInZone("Asia/Kuwait", prayerTimes.date ?? at);
      await schedulePrayerNativeNotifications({
        prayerKey: key,
        prayerName: PRAYER_AR[key],
        prayerTimeEpochMs: at.getTime(),
        dateISO,
        preAlertEnabled: (prayerPrefs.advanceMinutes ?? 0) > 0,
        enterAlertEnabled: true,
        preAlertMinutes: prayerPrefs.advanceMinutes ?? 0,
      });
      scheduled += 1;
    }
    lastError = null;
    return { scheduled };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    lastError = message;
    console.warn("[PrayerNotificationService] schedule failed", message);
    return { scheduled: 0, error: message };
  }
}

export async function cancelPrayerNotifications(): Promise<void> {
  try {
    await cancelAllPrayerNativeNotifications();
    lastError = null;
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    console.warn("[PrayerNotificationService] cancel failed", lastError);
  }
}

export async function listScheduledPrayerNotifications(): Promise<
  Array<{ id: number; title?: string; body?: string; at?: string }>
> {
  if (!isNative) return [];
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const pending = await LocalNotifications.getPending();
    return (pending.notifications ?? []).map((n) => ({
      id: Number(n.id),
      title: n.title,
      body: n.body,
      at: n.schedule?.at ? new Date(n.schedule.at).toISOString() : undefined,
    }));
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    console.warn("[PrayerNotificationService] list failed", lastError);
    return [];
  }
}

export function getPrayerNotificationLastError(): string | null {
  return lastError;
}
