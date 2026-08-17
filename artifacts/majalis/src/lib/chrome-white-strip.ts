/**
 * بوابة: لا شريط شبه أبيض فوق الشريط السفلي.
 * الدالة تُستخدم من الاختبار الثابت ومن Playwright.
 */
export function whitePixelRatio(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
): number {
  if (!rgba || width < 1 || height < 1) return 1;
  let white = 0;
  const n = width * height;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const r = rgba[o];
    const g = rgba[o + 1];
    const b = rgba[o + 2];
    const a = rgba[o + 3];
    if (a < 10) continue;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luma > 235) white += 1;
  }
  return white / n;
}

export const WHITE_STRIP_MAX_RATIO = 0.02;
