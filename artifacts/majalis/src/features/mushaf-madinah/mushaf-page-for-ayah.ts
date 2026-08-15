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
