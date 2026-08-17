import { pageFirstAyahMushaf1 } from "@/lib/quran-data/ayah-page-index.generated";
import { MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN } from "@/lib/quran-last-page";

/** صفحة المصحف (١–٦٠٤) التي تقع عليها الآية — بحث ثنائي على أول آية لكل صفحة. */
export function findMushafPageForAyah(surah: number, ayah: number): number {
  if (!Number.isFinite(surah) || !Number.isFinite(ayah) || surah < 1 || ayah < 1) {
    return MUSHAF_PAGE_MIN;
  }
  let lo = MUSHAF_PAGE_MIN;
  let hi = MUSHAF_PAGE_MAX;
  let ans = MUSHAF_PAGE_MIN;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [ps, pa] = pageFirstAyahMushaf1(mid).split(":").map(Number);
    if (ps! < surah || (ps === surah && pa! <= ayah)) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

export function parseVerseKey(verseKey: string): { surah: number; ayah: number } | null {
  const [s, a] = verseKey.split(":").map(Number);
  if (!Number.isFinite(s) || !Number.isFinite(a) || s! < 1 || a! < 1) return null;
  return { surah: s!, ayah: a! };
}

export type RecitationRange = "ayah" | "passage" | "page" | "surah";

export function uniqueVerseKeysFromRows(
  rows: Array<{ kind: string; words?: Array<{ verseKey: string }> }>,
): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.kind !== "line" || !row.words) continue;
    for (const w of row.words) {
      if (seen.has(w.verseKey)) continue;
      seen.add(w.verseKey);
      keys.push(w.verseKey);
    }
  }
  return keys;
}

/** نطاق التلاوة ضمن سورة واحدة (قيد محرّك الصوت). */
export function resolveRecitationLoop(
  range: RecitationRange,
  current: { surah: number; ayah: number },
  pageKeys: string[],
  surahAyahCount: number,
): { surah: number; startAyah: number; endAyah: number } {
  const surah = current.surah;
  const onPage = pageKeys
    .map(parseVerseKey)
    .filter((p): p is { surah: number; ayah: number } => !!p && p.surah === surah)
    .map((p) => p.ayah)
    .sort((a, b) => a - b);
  if (range === "ayah") {
    return { surah, startAyah: current.ayah, endAyah: current.ayah };
  }
  if (range === "surah") {
    return { surah, startAyah: 1, endAyah: Math.max(1, surahAyahCount) };
  }
  if (onPage.length === 0) {
    return { surah, startAyah: current.ayah, endAyah: current.ayah };
  }
  if (range === "page") {
    return { surah, startAyah: onPage[0]!, endAyah: onPage[onPage.length - 1]! };
  }
  const fromCurrent = onPage.filter((n) => n >= current.ayah);
  const endAyah = fromCurrent.length
    ? fromCurrent[fromCurrent.length - 1]!
    : onPage[onPage.length - 1]!;
  return { surah, startAyah: current.ayah, endAyah };
}
