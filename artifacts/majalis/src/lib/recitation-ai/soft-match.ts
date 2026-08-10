/**
 * مطابقة ناعمة للكلمات المطبَّعة (بعد normalizeQuranWord) —
 * تسامح محدود لأخطاء ASR الشائعة دون إخفاء أخطاء الحفظ الحقيقية.
 */

/** مسافة Levenshtein محدودة — تتوقف مبكرًا إن تجاوزت maxDist */
export function levenshteinAtMost(a: string, b: string, maxDist: number): number {
  if (a === b) return 0;
  const n = a.length;
  const m = b.length;
  if (Math.abs(n - m) > maxDist) return maxDist + 1;
  if (n === 0) return m;
  if (m === 0) return n;

  let prev = new Array<number>(m + 1);
  let curr = new Array<number>(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    curr[0] = i;
    let rowMin = curr[0]!;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= m; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      const v = Math.min(
        prev[j]! + 1,
        curr[j - 1]! + 1,
        prev[j - 1]! + cost,
      );
      curr[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > maxDist) return maxDist + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[m]!;
}

/**
 * هل الكلمتان المطبَّعتان متطابقتان بما يكفي لاعتبارهما match في المحاذاة؟
 * - تطابق تام دائمًا
 * - كلمات قصيرة جدًا (≤2): تطابق تام فقط
 * - غير ذلك: مسافة ≤1 وطول أدنى 3
 */
export function softEqualNormalized(a: string, b: string): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length <= 2 || b.length <= 2) return false;
  if (Math.abs(a.length - b.length) > 1) return false;
  return levenshteinAtMost(a, b, 1) <= 1;
}
