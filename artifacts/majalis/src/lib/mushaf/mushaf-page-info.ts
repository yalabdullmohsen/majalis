import { MUSHAF_INDEX, type MushafSurah } from "./kuwait-mushaf-data";

/** Surahs whose text appears on this mushaf page. */
export function getSurahsOnPage(page: number): MushafSurah[] {
  return MUSHAF_INDEX.surahs.filter((s) => s.startPage <= page && s.endPage >= page);
}

/** Approximate ayah count on page via surah boundaries (exact count needs API). */
export function estimateAyahsOnPage(page: number): number | null {
  const onPage = getSurahsOnPage(page);
  if (!onPage.length) return null;
  if (onPage.length === 1 && onPage[0].startPage === page && onPage[0].endPage === page) {
    return onPage[0].ayahs;
  }
  return null;
}

export type PageInfoSummary = {
  page: number;
  juz: number;
  hizb: number;
  quarter: number;
  surahs: MushafSurah[];
  primarySurah: string;
};

export function getPageInfoSummary(page: number): PageInfoSummary {
  const meta = MUSHAF_INDEX.pages.find((p) => p.page === page) ?? MUSHAF_INDEX.pages[0];
  const surahs = getSurahsOnPage(page);
  return {
    page: meta.page,
    juz: meta.juz,
    hizb: meta.hizb,
    quarter: meta.quarter,
    surahs,
    primarySurah: meta.surahName,
  };
}
