/**
 * اشتقاق مستطيلات نسبية (0..1) لكل آية من كلمات QPC (word ids / position).
 * طبقة الضغط فقط — بلا تظليل بصري كبير (التظليل على .mf2-ayah-group).
 *
 * علامة رقم الآية (charType=end) تنتمي للآية التي تنهيها وتُحسب ضمن حيزها،
 * بوزن أخف من الكلمة العادية حتى لا تسرق حيز الآية التالية.
 */
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";
import { MUSHAF_PAGE_LINE_SLOTS } from "@/features/mushaf/config";

/** وزن علامة رقم الآية نسبةً إلى كلمة عادية في تقدير الحيز الأفقي */
export const AYAH_END_MARKER_WEIGHT = 0.35;

export type AyahHitRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type AyahHitRegion = {
  verseKey: string;
  page: number;
  rects: AyahHitRect[];
};

function slotWeight(w: QpcWord): number {
  return w.charType === "end" ? AYAH_END_MARKER_WEIGHT : 1;
}

/**
 * على سطر RTL تُعرض الكلمات من اليمين لليسار بنفس ترتيب المصفوفة.
 * الحيز = مجموع أوزان الكلمات (العلامة أخف)، لا إزاحة محارف.
 */
export function horizontalSpan(
  lineWords: QpcWord[],
  ayahWords: QpcWord[],
): { x: number; w: number } {
  if (!lineWords.length) return { x: 0, w: 1 };

  const ids = new Set(ayahWords.map((w) => w.id));
  const weights = lineWords.map(slotWeight);
  const total = weights.reduce((a, b) => a + b, 0) || 1;

  let cum = 0;
  let start = -1;
  let end = -1;
  for (let i = 0; i < lineWords.length; i++) {
    const w = lineWords[i]!;
    const wt = weights[i]!;
    if (ids.has(w.id)) {
      if (start < 0) start = cum;
      end = cum + wt;
    }
    cum += wt;
  }
  if (start < 0) return { x: 0, w: 1 };

  // RTL: أول كلمة في المصفوفة على اليمين → x أكبر في إحداثيات LTR للـ SVG
  const right = 1 - start / total;
  const left = 1 - end / total;
  const x = Math.min(left, right);
  const w = Math.max(0.02, Math.abs(right - left));
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

  regions.sort((a, b) => {
    const [as, aa] = a.verseKey.split(":").map(Number);
    const [bs, ba] = b.verseKey.split(":").map(Number);
    return as - bs || aa - ba;
  });
  return regions;
}
