/**
 * PrayerNotificationScheduler — بناء الجدول المطلوب (منطق نقي قابل للاختبار).
 */
import {
  friendlyAdhanNotificationKey,
  hashPrayerNotificationId,
  logicalPrayerNotificationId,
} from "@/lib/prayer-notification-ids";
import { isPrayerAlertEnabled } from "./preferences";
import {
  PRAYER_NOTIFICATION_AR,
  type DesiredEnterNotification,
  type PrayerDayTimes,
  type PrayerNotificationPreferences,
} from "./types";

export function buildEnterNotificationTitle(prayerNameAr: string): string {
  return `حان وقت صلاة ${prayerNameAr}`;
}

export function buildEnterNotificationBody(opts: {
  timeLabel?: string;
  dataTrusted: boolean;
}): string {
  if (!opts.dataTrusted) {
    return "تعذّر التحقق من وقت الصلاة حاليًا.";
  }
  return opts.timeLabel?.trim() || "حسب إعدادات الموقع والطريقة المختارة.";
}

/** يبني إشعارات دخول الوقت المستقبلية فقط. */
export function buildDesiredEnterNotifications(
  days: PrayerDayTimes[],
  prefs: PrayerNotificationPreferences,
  nowMs: number,
): DesiredEnterNotification[] {
  if (!prefs.featureEnabled || !prefs.masterEnabled) return [];
  const out: DesiredEnterNotification[] = [];
  const seen = new Set<number>();

  for (const day of days) {
    if (!day.valid) continue;
    for (const slot of day.slots) {
      if (!isPrayerAlertEnabled(prefs, slot.key)) continue;
      if (slot.epochMs == null || !Number.isFinite(slot.epochMs)) continue;
      if (slot.epochMs <= nowMs) continue;

      const id = hashPrayerNotificationId(slot.key, slot.dateISO, "enter");
      if (seen.has(id)) continue;
      seen.add(id);

      const nameAr = slot.nameAr || PRAYER_NOTIFICATION_AR[slot.key];
      out.push({
        id,
        logicalId: logicalPrayerNotificationId(slot.key, slot.dateISO, "enter"),
        friendlyKey: friendlyAdhanNotificationKey(slot.key, slot.dateISO, "enter"),
        prayerKey: slot.key,
        dateISO: slot.dateISO,
        fireAtMs: slot.epochMs,
        title: buildEnterNotificationTitle(nameAr),
        body: buildEnterNotificationBody({ dataTrusted: true }),
      });
    }
  }

  return out.sort((a, b) => a.fireAtMs - b.fireAtMs);
}

export function assertNoDuplicateDesiredIds(items: DesiredEnterNotification[]): boolean {
  const ids = new Set<number>();
  for (const item of items) {
    if (ids.has(item.id)) return false;
    ids.add(item.id);
  }
  return true;
}
