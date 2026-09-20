/**
 * استخراج إحداثيات موثّقة فقط من رابط خرائط يحتوي أرقامًا صريحة.
 * ممنوع: تحويل اسم مسجد/منطقة إلى إحداثيات · تخمين من نص المكان.
 */

export type ExplicitCoords = { latitude: number; longitude: number };

const PAIR_RE =
  /(?:[?&]q=|query=|@|!3d)(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/i;
const BARE_PAIR_RE = /(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/;

function isPlausibleKuwaitish(lat: number, lng: number): boolean {
  // نطاق واسع للخليج — رفض القيم غير المعقولة دون افتراض دولة
  return lat >= 24 && lat <= 31 && lng >= 46 && lng <= 52;
}

/**
 * يُرجع إحداثيات فقط إذا وُجد زوج أرقام صريح في الرابط.
 * لا يُرجع شيئًا لروابط البحث النصي (`query=مسجد…`).
 */
export function parseExplicitCoordsFromMapsUrl(
  mapsUrl: string | null | undefined,
): ExplicitCoords | null {
  const raw = String(mapsUrl ?? "").trim();
  if (!raw) return null;
  // رفض واضح إن كان الاستعلام نصًا مرمّزًا بلا أرقام
  if (/[?&](?:q|query)=(?!-?\d)[^&]+/i.test(raw) && !PAIR_RE.test(raw) && !BARE_PAIR_RE.test(raw)) {
    return null;
  }
  const m = raw.match(PAIR_RE) || raw.match(BARE_PAIR_RE);
  if (!m) return null;
  const latitude = Number(m[1]);
  const longitude = Number(m[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  if (!isPlausibleKuwaitish(latitude, longitude)) {
    // أرقام خارج النطاق المتوقع لبيانات المشروع الحالية → تجاهل (لا اختراع بديل)
    return null;
  }
  return { latitude, longitude };
}

export function isMapEligible(coords: ExplicitCoords | null | undefined): boolean {
  return Boolean(
    coords &&
      Number.isFinite(coords.latitude) &&
      Number.isFinite(coords.longitude),
  );
}
