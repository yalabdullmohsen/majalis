/**
 * مقاسات منطقية لبوابات المصحف — مصدر واحد لكل بوابات القياس.
 * المرجع التاريخي: 390×844 (iPhone 12/13/14).
 */
export const MUSHAF_REF_VIEWPORT = Object.freeze({
  id: "iphone-12",
  width: 390,
  height: 844,
  label: "iPhone 12/13/14",
});

export const MUSHAF_GATE_VIEWPORTS = Object.freeze([
  Object.freeze({ id: "iphone-se", width: 375, height: 667, label: "iPhone SE / 8" }),
  MUSHAF_REF_VIEWPORT,
  Object.freeze({ id: "iphone-15-pro-max", width: 430, height: 932, label: "iPhone 15 Pro Max" }),
  Object.freeze({ id: "ipad-mini", width: 744, height: 1133, label: "iPad mini" }),
]);

/** صفحات حرجة تُقاس على كل مقاس (اكتمال · اقتطاع · تقاطع · تجاوز أفقي) */
export const MUSHAF_MULTI_VIEWPORT_PAGES = Object.freeze([
  1, 2, 3, 50, 235, 283, 306, 528, 588, 604,
]);

/**
 * يحلّل `MUSHAF_GATE_VIEWPORT=390x844` أو `iphone-se`.
 * الافتراضي = المرجع 390×844.
 */
export function resolveGateViewport(raw = process.env.MUSHAF_GATE_VIEWPORT) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return { ...MUSHAF_REF_VIEWPORT };
  const byId = MUSHAF_GATE_VIEWPORTS.find((v) => v.id === s);
  if (byId) return { ...byId };
  const m = s.match(/^(\d{2,4})\s*[x×]\s*(\d{2,4})$/i);
  if (m) {
    const width = Number(m[1]);
    const height = Number(m[2]);
    const known = MUSHAF_GATE_VIEWPORTS.find((v) => v.width === width && v.height === height);
    return known
      ? { ...known }
      : { id: `${width}x${height}`, width, height, label: `${width}×${height}` };
  }
  throw new Error(`MUSHAF_GATE_VIEWPORT غير صالح: ${raw}`);
}
