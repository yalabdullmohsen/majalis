/**
 * انتشار صفحتين متقابلتين لمصحف المدينة (RTL):
 * اليسار = زوجية · اليمين = فردية · الصفحة ١ منفردة عند الفتح.
 */
export type MushafSpread = {
  left: number | null;
  right: number;
  /** الصفحة النشطة للتظليل/الصوت */
  focus: number;
  isSpread: boolean;
};

const TOTAL = 604;

export function getMushafSpread(page: number, enabled: boolean): MushafSpread {
  const p = Math.min(TOTAL, Math.max(1, Math.floor(page)));
  if (!enabled || p === 1) {
    return { left: null, right: p, focus: p, isSpread: false };
  }
  if (p % 2 === 0) {
    const right = Math.min(TOTAL, p + 1);
    return { left: p, right, focus: p, isSpread: right !== p };
  }
  return { left: p - 1, right: p, focus: p, isSpread: true };
}

/** هل العرض الحالي مناسب لانتشار صفحتين؟ */
export function prefersMushafSpread(widthPx: number, heightPx: number): boolean {
  if (widthPx < 900) return false;
  if (heightPx > 0 && widthPx / heightPx < 1.15) return false; /* ليس landscape تقريبًا */
  return true;
}
