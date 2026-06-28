import pageIndex from "../../../public/data/mushaf/page-index.json";

export type MushafSurah = {
  number: number;
  name: string;
  englishName: string;
  ayahs: number;
  revelation: string;
  startPage: number;
  endPage: number;
};

export type MushafPageMeta = {
  page: number;
  juz: number;
  hizb: number;
  quarter: number;
  surah: number;
  surahName: string;
};

export type MushafPageIndex = {
  edition: string;
  totalPages: number;
  generatedAt: string;
  source: string;
  surahs: MushafSurah[];
  juzs: Array<{ number: number; startPage: number; verseMapping: Record<string, string> }>;
  hizbs: Array<{ number: number; startPage: number; verseMapping: Record<string, string> }>;
  quarters: Array<{ number: number; juz: number; hizb: number; startPage: number }>;
  pages: MushafPageMeta[];
};

export const MUSHAF_INDEX = pageIndex as unknown as MushafPageIndex;
export const MUSHAF_TOTAL_PAGES = MUSHAF_INDEX.totalPages;

export function getPageMeta(page: number): MushafPageMeta {
  return MUSHAF_INDEX.pages.find((p) => p.page === page) ?? MUSHAF_INDEX.pages[0];
}

export function getSurahMeta(surah: number): MushafSurah | undefined {
  return MUSHAF_INDEX.surahs.find((s) => s.number === surah);
}

export function getJuzStartPage(juz: number): number {
  return MUSHAF_INDEX.juzs.find((j) => j.number === juz)?.startPage ?? 1;
}

export function getHizbStartPage(hizb: number): number {
  return MUSHAF_INDEX.hizbs.find((h) => h.number === hizb)?.startPage ?? 1;
}

export function getQuarterStartPage(quarter: number): number {
  return MUSHAF_INDEX.quarters.find((q) => q.number === quarter)?.startPage ?? 1;
}

export function getSurahStartPage(surah: number): number {
  return getSurahMeta(surah)?.startPage ?? 1;
}

export function clampPage(page: number): number {
  return Math.min(MUSHAF_TOTAL_PAGES, Math.max(1, Math.round(page)));
}
