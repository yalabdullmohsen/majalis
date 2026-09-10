/**
 * معرّفات إشعارات صلاة قابلة للتنبؤ: hash(prayer, dateISO, kind)
 * يمنع التكرار والتضاعف عبر الأيام.
 *
 * مفاتيح الصلوات الثابتة (لا random):
 *   fajr | dhuhr | asr | maghrib | isha
 *
 * Capacitor يتطلّب id رقميًا؛ المفتاح الودّي في extra.friendlyKey
 * بصيغة: adhan-fajr-yyyy-mm-dd (دخول الوقت) أو …-pre / …-post.
 */

export const STABLE_PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type StablePrayerKey = (typeof STABLE_PRAYER_KEYS)[number];

export type PrayerNotifIdKind = "pre" | "enter" | "post" | "iqamah";

const PRAYER_ORDER = STABLE_PRAYER_KEYS;

/** مفتاح ودّي ثابت للتشخيص وعدم التكرار المنطقي. */
export function friendlyAdhanNotificationKey(
  prayerKey: string,
  dateISO: string,
  kind: PrayerNotifIdKind = "enter",
): string {
  const pk = prayerKey.toLowerCase().replace(/^prayer-/, "");
  const base = `adhan-${pk}-${dateISO}`;
  if (kind === "enter") return base;
  return `${base}-${kind}`;
}

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
  const kinds: PrayerNotifIdKind[] = ["pre", "enter", "post", "iqamah"];
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


/**
 * معرّف منطقي ثابت قابل للتحليل (ليس UUID):
 *   prayer.{prayerId}.{localDate}.{type}
 *   prayer.{prayerId}.{localDate}.pre.{minutes}
 * type: entry | iqamah | post | pre
 */
export function logicalPrayerNotificationId(
  prayerKey: string,
  dateISO: string,
  kind: PrayerNotifIdKind,
  preMinutes?: number,
): string {
  const pk = prayerKey.toLowerCase().replace(/^prayer-/, "");
  if (kind === "enter") return `prayer.${pk}.${dateISO}.entry`;
  if (kind === "pre") {
    const m = typeof preMinutes === "number" && preMinutes > 0 ? preMinutes : 0;
    return `prayer.${pk}.${dateISO}.pre.${m}`;
  }
  if (kind === "iqamah") return `prayer.${pk}.${dateISO}.iqamah`;
  return `prayer.${pk}.${dateISO}.post`;
}

export function parseLogicalPrayerNotificationId(id: string): {
  prayerId: string;
  localDate: string;
  kind: PrayerNotifIdKind;
  preMinutes?: number;
} | null {
  const m = /^prayer\.([a-z]+)\.(\d{4}-\d{2}-\d{2})\.(entry|iqamah|post|pre)(?:\.(\d+))?$/.exec(id);
  if (!m) return null;
  const kindRaw = m[3];
  const kind: PrayerNotifIdKind =
    kindRaw === "entry" ? "enter" : kindRaw === "pre" ? "pre" : kindRaw === "iqamah" ? "iqamah" : "post";
  return {
    prayerId: m[1],
    localDate: m[2],
    kind,
    preMinutes: kind === "pre" && m[4] ? Number(m[4]) : undefined,
  };
}

/** هل المفتاح/الودّي يخص مساحة أسماء الصلاة؟ */
export function isPrayerNotificationNamespace(key: string | null | undefined): boolean {
  if (!key) return false;
  return key.startsWith("prayer.") || key.startsWith("adhan-");
}
