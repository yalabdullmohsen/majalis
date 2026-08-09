/**
 * مطابقة بحث متسامحة فوق التطبيع المشترك:
 * ترتيب (تام → بادئة → جزئي → تحرير) + الـ اختيارية + Levenshtein.
 */
import { normalizeArabic, normalizeForSearch } from "@/shared/arabic-normalize";

export type MatchKind = "exact" | "prefix" | "substring" | "edit";

export type TolerantMatch = {
  kind: MatchKind;
  /** أقل = أفضل (exact=0 … edit=3) */
  rank: 0 | 1 | 2 | 3;
  distance: number;
  /** مقطع مطبّع طابق الاستعلام (لفهرسة/تشخيص) */
  matchedNorm: string;
};

/** إزالة «ال» التعريف من بداية نص مطبّع. */
export function stripDefiniteArticle(normalized: string): string {
  if (!normalized) return "";
  return normalized.replace(/^ال/, "");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  if (Math.abs(m - n) > 2) {
    // حدّ أعلى سريع قبل الجدول الكامل
    // (عتبة البحث القصوى 2)
  }
  const prev = new Array<number>(n + 1);
  const cur = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = cur[j]!;
  }
  return prev[n]!;
}

export function maxEditDistance(wordLen: number): number {
  if (wordLen <= 0) return 0;
  return wordLen <= 5 ? 1 : 2;
}

function better(a: TolerantMatch | null, b: TolerantMatch | null): TolerantMatch | null {
  if (!a) return b;
  if (!b) return a;
  if (a.rank !== b.rank) return a.rank < b.rank ? a : b;
  return a.distance <= b.distance ? a : b;
}

function scorePair(hay: string, needle: string): TolerantMatch | null {
  if (!needle) return { kind: "exact", rank: 0, distance: 0, matchedNorm: hay };
  if (!hay) return null;

  const hayBare = stripDefiniteArticle(hay);
  const needleBare = stripDefiniteArticle(needle);

  if (hay === needle || hayBare === needleBare || hay === needleBare || hayBare === needle) {
    return { kind: "exact", rank: 0, distance: 0, matchedNorm: needle };
  }

  // استعلام حرفين: بادئة/تطابق فقط — بلا substring/edit يغرق النتائج
  if (needleBare.length <= 2) {
    if (
      hay.startsWith(needle) ||
      hayBare.startsWith(needleBare) ||
      hay.startsWith(needleBare) ||
      hayBare.startsWith(needle)
    ) {
      return { kind: "prefix", rank: 1, distance: 0, matchedNorm: needle };
    }
    return null;
  }

  if (
    hay.startsWith(needle) ||
    hayBare.startsWith(needleBare) ||
    hay.startsWith(needleBare) ||
    hayBare.startsWith(needle)
  ) {
    return { kind: "prefix", rank: 1, distance: 0, matchedNorm: needle };
  }

  if (
    hay.includes(needle) ||
    hayBare.includes(needleBare) ||
    hay.includes(needleBare) ||
    hayBare.includes(needle)
  ) {
    return { kind: "substring", rank: 2, distance: 0, matchedNorm: needle };
  }

  // مسافة تحرير على الكلمات (والنص كامل إن تقارب الطول)
  const maxDist = maxEditDistance(needleBare.length);
  let bestDist = Infinity;
  const candidates = new Set<string>([hay, hayBare, ...hay.split(" "), ...hayBare.split(" ")]);
  for (const c of candidates) {
    if (!c) continue;
    if (Math.abs(c.length - needleBare.length) > maxDist) continue;
    const d = levenshtein(c, needleBare);
    if (d <= maxDist && d < bestDist) bestDist = d;
    if (bestDist === 0) break;
  }
  if (bestDist <= maxDist) {
    return { kind: "edit", rank: 3, distance: bestDist, matchedNorm: needle };
  }
  return null;
}

/**
 * يقيّم تطابق haystack مع needle بعد التطبيع.
 * يُفضّل تمرير hayNorm مسبقاً إن وُجد (فهرس محمّل مرة واحدة).
 */
export function scoreTolerantMatch(
  haystack: string | null | undefined,
  needle: string,
  hayNormPrecomputed?: string,
): TolerantMatch | null {
  const q = normalizeForSearch(needle);
  if (!q) return { kind: "exact", rank: 0, distance: 0, matchedNorm: "" };
  const hay = hayNormPrecomputed ?? normalizeForSearch(haystack ?? "");
  if (!hay) return null;

  // كلمات الاستعلام: كل كلمة يجب أن تطابق شيئاً؛ نأخذ أسوأ رتبة
  const words = q.split(" ").filter(Boolean);
  if (words.length <= 1) return scorePair(hay, q);

  let acc: TolerantMatch | null = null;
  for (const w of words) {
    const m = scorePair(hay, w);
    if (!m) return null;
    acc = better(
      acc,
      // ارفع الرتبة قليلاً للاستعلامات متعددة الكلمات عند النجاح الجزئي
      m,
    );
  }
  return acc;
}

export function tolerantIncludes(
  haystack: string | null | undefined,
  needle: string,
  hayNormPrecomputed?: string,
): boolean {
  return scoreTolerantMatch(haystack, needle, hayNormPrecomputed) !== null;
}

export function compareTolerantMatches(a: TolerantMatch, b: TolerantMatch): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  return a.distance - b.distance;
}

export type HighlightRange = { start: number; end: number };

/**
 * يبني خريطة من فهرس المطبّع → فهرس الأصل، ثم يعيد نطاقات الإبراز على النص الأصلي.
 */
export function findOriginalHighlightRanges(
  original: string,
  query: string,
): HighlightRange[] {
  const q = normalizeForSearch(query);
  if (!original || !q || q.length < 2) return [];

  const map: number[] = []; // normIndex → origIndex
  let norm = "";
  // نعيد تطبيع الأصل حرفاً حرفاً عبر النافذة المنزلقة بنفس منطق normalize
  // تقريب عملي: طبّع شرائح متزايدة واحفظ نقاط الحدود
  for (let i = 0; i < original.length; i++) {
    const before = normalizeArabic(original.slice(0, i));
    const after = normalizeArabic(original.slice(0, i + 1));
    if (after.length > before.length) {
      for (let k = before.length; k < after.length; k++) {
        map[k] = i;
        norm += after[k]!;
      }
    }
  }
  // قد يُسقِط التطبيع حروفاً في النهاية دون زيادة — أعد البناء الموثوق:
  norm = normalizeArabic(original);
  if (!norm.includes(q) && !stripDefiniteArticle(norm).includes(stripDefiniteArticle(q))) {
    // جرّب مطابقة بلا ال
    const qb = stripDefiniteArticle(q);
    const nb = stripDefiniteArticle(norm);
    const idxBare = nb.indexOf(qb);
    if (idxBare === -1 || qb.length < 2) return [];
    // أبرز كلمة قريبة في الأصل بالبحث عن أول مقطع خام يطبع إلى qb
    return approximateOriginalRange(original, qb);
  }

  const needle = norm.includes(q) ? q : stripDefiniteArticle(q);
  const hay = norm.includes(q) ? norm : stripDefiniteArticle(norm);
  const idx = hay.indexOf(needle);
  if (idx === -1) return approximateOriginalRange(original, needle);

  // أعد بناء الخريطة بدقة كافية عبر المسح
  const origMap = buildNormToOrigMap(original);
  const startOrig = origMap[idx] ?? 0;
  const endIdx = idx + needle.length - 1;
  const endOrig = (origMap[endIdx] ?? startOrig) + 1;
  if (endOrig <= startOrig) return approximateOriginalRange(original, needle);
  return [{ start: startOrig, end: Math.min(original.length, endOrig) }];
}

function buildNormToOrigMap(original: string): number[] {
  const map: number[] = [];
  let prev = "";
  for (let i = 0; i < original.length; i++) {
    const next = normalizeArabic(original.slice(0, i + 1));
    if (next.length > prev.length) {
      for (let k = prev.length; k < next.length; k++) map[k] = i;
    }
    prev = next;
  }
  return map;
}

function approximateOriginalRange(original: string, needleNorm: string): HighlightRange[] {
  // ابحث نافذة متنامية في الأصل تطبع لتشمل needleNorm
  const n = original.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j <= n; j++) {
      const slice = original.slice(i, j);
      const nn = normalizeArabic(slice);
      if (nn === needleNorm || stripDefiniteArticle(nn) === needleNorm) {
        return [{ start: i, end: j }];
      }
      if (nn.length > needleNorm.length + 2) break;
    }
  }
  return [];
}

/** يبرز المطابقة في النص الأصلي (لا المطبّع). */
export function highlightOriginalParts(
  original: string,
  query: string,
): Array<{ text: string; hit: boolean }> {
  const ranges = findOriginalHighlightRanges(original, query);
  if (!ranges.length) return [{ text: original, hit: false }];
  const parts: Array<{ text: string; hit: boolean }> = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) parts.push({ text: original.slice(cursor, r.start), hit: false });
    parts.push({ text: original.slice(r.start, r.end), hit: true });
    cursor = r.end;
  }
  if (cursor < original.length) parts.push({ text: original.slice(cursor), hit: false });
  return parts;
}
