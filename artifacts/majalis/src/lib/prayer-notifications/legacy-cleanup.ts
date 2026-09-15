/**
 * تنظيف معرفات الأذان القديمة فقط — دون المساس بورد القرآن أو الذكر أو المحتوى.
 * ملاحظة: النطاق 9400+idx كان يتصادم مع تذكير الذكر (9401+). لا يُلغى بعد الآن.
 */
import { isNative } from "@/lib/capacitor-utils";
import {
  allPrayerNotificationIdsForWindow,
  dateISOInZone,
  isPrayerNotificationNamespace,
} from "@/lib/prayer-notification-ids";
import { getActivePrayerLocation } from "@/lib/prayer-location-prefs";

export const LEGACY_PRAYER_FIXED_IDS: readonly number[] = [
  9100, 9101, 9102, 9103, 9104, 9200, 9201, 9202, 9203, 9204,
];

export const PROTECTED_NON_PRAYER_IDS: readonly number[] = [9301];

export function isProtectedNonPrayerId(id: number): boolean {
  if (PROTECTED_NON_PRAYER_IDS.includes(id)) return true;
  if (id >= 9401 && id <= 9499) return true;
  return false;
}

export function collectLegacyPrayerCancelIds(opts: {
  timeZone: string;
  nowMs?: number;
  pending?: Array<{ id: number; extra?: Record<string, unknown> | null }>;
}): Array<{ id: number }> {
  const now = opts.nowMs ?? Date.now();
  const today = dateISOInZone(opts.timeZone, new Date(now));
  const tomorrow = dateISOInZone(opts.timeZone, new Date(now + 24 * 3600_000));
  const ids = allPrayerNotificationIdsForWindow([today, tomorrow]);

  for (const id of LEGACY_PRAYER_FIXED_IDS) {
    if (!isProtectedNonPrayerId(id)) ids.push({ id });
  }

  for (const n of opts.pending ?? []) {
    if (isProtectedNonPrayerId(n.id)) continue;
    const extra = n.extra ?? {};
    const kind = String(extra.kind || "");
    const friendly = String(extra.friendlyKey || extra.friendly_key || "");
    const logical = String(extra.logicalId || "");
    const prayerKey = String(extra.prayerKey || "").toLowerCase();
    const isPrayer =
      kind.startsWith("prayer-") ||
      extra.adhanSegment === true ||
      isPrayerNotificationNamespace(friendly) ||
      isPrayerNotificationNamespace(logical) ||
      ["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(prayerKey);
    if (isPrayer) ids.push({ id: n.id });
  }

  const uniq = new Map<number, { id: number }>();
  for (const row of ids) {
    if (isProtectedNonPrayerId(row.id)) continue;
    uniq.set(row.id, row);
  }
  return [...uniq.values()];
}

export async function cancelLegacyPrayerNotificationsOnly(): Promise<number> {
  if (!isNative) return 0;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const tz = getActivePrayerLocation().timeZone || "Asia/Kuwait";
    let pending: Array<{ id: number; extra?: Record<string, unknown> | null }> = [];
    try {
      const res = await LocalNotifications.getPending();
      pending = (res.notifications ?? []).map((n) => ({
        id: n.id,
        extra: (n.extra ?? null) as Record<string, unknown> | null,
      }));
    } catch {
      pending = [];
    }
    const toCancel = collectLegacyPrayerCancelIds({ timeZone: tz, pending });
    if (!toCancel.length) return 0;
    await LocalNotifications.cancel({ notifications: toCancel });
    return toCancel.length;
  } catch {
    return 0;
  }
}
