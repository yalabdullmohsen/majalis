/**
 * PrayerNotificationService — واجهة رقيقة فوق المسار الموحّد فقط.
 * لا يُلغي كل الإشعارات ثم يعيد الجدولة (مسار قديم مزدوج).
 */
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  listPendingPrayerNotifications,
  type PermissionStatus,
} from "@/lib/prayer-local-notifications";
import { cancelLegacyPrayerNotificationsOnly } from "@/lib/prayer-notifications/legacy-cleanup";
import { isNative } from "@/lib/capacitor-utils";
import type { PrayerTimesPayload } from "@/lib/prayer-times";

let lastError: string | null = null;

export async function checkNotificationPermissionStatus(): Promise<PermissionStatus> {
  return getNotificationPermissionStatus();
}

export { requestNotificationPermission };

/** يعيد جدولة تنبيهات الصلاة عبر المنسّق الموحّد فقط. */
export async function schedulePrayerNotifications(
  payload: PrayerTimesPayload,
  opts?: { force?: boolean },
): Promise<{ scheduled: number; error?: string }> {
  try {
    const { startPrayerAlertScheduler } = await import("@/lib/prayer-alert-scheduler");
    await startPrayerAlertScheduler(payload, {
      forceNativeReschedule: opts?.force !== false,
    });
    lastError = null;
    const pending = await listPendingPrayerNotifications();
    return { scheduled: pending.count };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    lastError = message;
    console.warn("[PrayerNotificationService] schedule failed", message);
    return { scheduled: 0, error: message };
  }
}

/** إلغاء إشعارات الأذان فقط — دون المساس بإشعارات المحتوى الأخرى. */
export async function cancelPrayerNotifications(): Promise<void> {
  try {
    await cancelLegacyPrayerNotificationsOnly();
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
    const pending = await listPendingPrayerNotifications();
    return pending.items.map((n) => ({
      id: n.id,
      at: n.at ?? undefined,
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
