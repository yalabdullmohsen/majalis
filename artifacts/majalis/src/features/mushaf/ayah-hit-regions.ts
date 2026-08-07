/**
 * اشتقاق مستطيلات نسبية (0..1) لكل آية من تخطيط أسطر QPC V2 المؤكَّد.
 * ليست مضلعات صور مصحف المدينة — مسار الصور/المضلعات أُزيل؛ نعتمد QPC فقط.
 */
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";
import { MUSHAF_PAGE_LINE_SLOTS } from "@/features/mushaf/config";

export type AyahHitRect = {
  /** نسبة من عرض الصفحة (0 يمين في RTL عبر SVG viewBox عادي: 0 يسار) */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type AyahHitRegion = {
  /** surah:ayah */
  verseKey: string;
  page: number;
  rects: AyahHitRect[];
};

function wordsOnLine(words: QpcWord[]): QpcWord[] {
  return words.filter((w) => w.charType !== "end" || w.textUthmani.length > 0);
}

/**
 * على سطر RTL تُعرض الكلمات من اليمين لليسار بنفس ترتيب المصفوفة.
 * نقارب الحيز الأفقي بنسبة عدد الكلمات.
 */
function horizontalSpan(
  lineWords: QpcWord[],
  ayahWords: QpcWord[],
): { x: number; w: number } {
  const usable = wordsOnLine(lineWords);
  const total = Math.max(1, usable.length);
  if (!usable.length) return { x: 0, w: 1 };

  const ids = new Set(ayahWords.map((w) => w.id));
  let first = -1;
  let last = -1;
  usable.forEach((w, i) => {
    if (ids.has(w.id)) {
      if (first < 0) first = i;
      last = i;
    }
  });
  if (first < 0) return { x: 0, w: 1 };

  // RTL: أول كلمة في المصفوفة على اليمين → x أكبر في إحداثيات LTR للـ SVG
  const right = 1 - first / total;
  const left = 1 - (last + 1) / total;
  const x = Math.min(left, right);
  const w = Math.max(0.04, Math.abs(right - left));
  return { x, w };
}

/** يبني مناطق الضغط لكل آية في الصفحة */
export function buildAyahHitRegions(layout: MushafPageLayout | null): AyahHitRegion[] {
  if (!layout) return [];

  const lineSlots = MUSHAF_PAGE_LINE_SLOTS;
  const byAyah = new Map<string, { words: QpcWord[]; lines: Map<number, QpcWord[]> }>();

  for (const row of layout.rows) {
    if (row.kind !== "line") continue;
    for (const w of row.words) {
      let entry = byAyah.get(w.verseKey);
      if (!entry) {
        entry = { words: [], lines: new Map() };
        byAyah.set(w.verseKey, entry);
      }
      entry.words.push(w);
      const lw = entry.lines.get(row.lineNumber) ?? [];
      lw.push(w);
      entry.lines.set(row.lineNumber, lw);
    }
  }

  const regions: AyahHitRegion[] = [];
  for (const [verseKey, entry] of byAyah) {
    const rects: AyahHitRect[] = [];
    for (const [lineNumber, ayahLineWords] of entry.lines) {
      const row = layout.rows.find(
        (r) => r.kind === "line" && r.lineNumber === lineNumber,
      );
      if (!row || row.kind !== "line") continue;
      const { x, w } = horizontalSpan(row.words, ayahLineWords);
      const y = (lineNumber - 1) / lineSlots;
      const h = 1 / lineSlots;
      rects.push({ x, y, w, h });
    }
    if (rects.length) {
      regions.push({ verseKey, page: layout.pageNumber, rects });
    }
  }

  // ترتيب طبيعي: بسورة ثم آية
  regions.sort((a, b) => {
    const [as, aa] = a.verseKey.split(":").map(Number);
    const [bs, ba] = b.verseKey.split(":").map(Number);
    return as - bs || aa - ba;
  });
  return regions;
}
