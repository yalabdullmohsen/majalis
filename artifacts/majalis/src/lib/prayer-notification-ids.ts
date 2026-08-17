/**
 * معرّفات إشعارات صلاة قابلة للتنبؤ: hash(prayer, dateISO, kind)
 * يمنع التكرار والتضاعف عبر الأيام.
 */

export type PrayerNotifIdKind = "pre" | "enter" | "post";

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

/** نطاق رقمي آمن لـ Capacitor (موجب، مستقر). */
export function hashPrayerNotificationId(
  prayerKey: string,
  dateISO: string,
  kind: PrayerNotifIdKind,
): number {
  const s = `${prayerKey.toLowerCase()}|${dateISO}|${kind}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 200_000 + (Math.abs(h) % 700_000_000);
}

/** معرّفات اليوم + الغد لكل الصلوات (لإلغاء شامل قبل إعادة الجدولة). */
export function allPrayerNotificationIdsForWindow(dateISOs: string[]): Array<{ id: number }> {
  const kinds: PrayerNotifIdKind[] = ["pre", "enter", "post"];
  const out: Array<{ id: number }> = [];
  for (const dateISO of dateISOs) {
    for (const prayer of PRAYER_ORDER) {
      for (const kind of kinds) {
        out.push({ id: hashPrayerNotificationId(prayer, dateISO, kind) });
      }
    }
  }
  return out;
}

export function dateISOInZone(timeZone: string, date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuwait",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
}
