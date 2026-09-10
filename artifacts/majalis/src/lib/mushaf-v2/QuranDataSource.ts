/**
 * QuranDataSource — طبقة قراءة بيانات القرآن الموثّقة فقط.
 * لا تعديل للنص العثماني؛ تغليف لمصادر quran-v2 / quran-api.
 */

import {
  getSurahMeta,
  JUZ_START_PAGES,
  SURAH_START_PAGES,
  type StaticSurahMeta,
} from "@/lib/quran-api";
import {
  getCachedMushafPage,
  loadChapters,
  loadMushafPage,
  type MushafChapter,
  type MushafPageLayout,
} from "@/lib/quran-data/qpc-page-data";
import {
  clampMushafPage,
  MUSHAF_PAGE_MAX,
  MUSHAF_PAGE_MIN,
} from "@/lib/quran-last-page";
import { MUSHAF_PROVENANCE } from "./provenance";

export type SurahSummary = {
  id: number;
  nameArabic: string;
  revelationPlace: "مكية" | "مدنية";
  versesCount: number;
  startPage: number;
};

export type JuzSummary = {
  juz: number;
  startPage: number;
  startSurahName: string;
};

export const QuranDataSource = {
  provenance: MUSHAF_PROVENANCE,
  pageMin: MUSHAF_PAGE_MIN,
  pageMax: MUSHAF_PAGE_MAX,

  clampPage(page: number): number {
    return clampMushafPage(page);
  },

  getSurahMeta(id: number): StaticSurahMeta {
    return getSurahMeta(id);
  },

  listSurahSummaries(): SurahSummary[] {
    return Array.from({ length: 114 }, (_, i) => {
      const id = i + 1;
      const meta = getSurahMeta(id);
      return {
        id,
        nameArabic: meta.name,
        revelationPlace: meta.revelation,
        versesCount: meta.ayahs,
        startPage: SURAH_START_PAGES[i] ?? 1,
      };
    });
  },

  listJuzSummaries(): JuzSummary[] {
    return JUZ_START_PAGES.map((startPage, i) => {
      let surahId = 1;
      for (let s = 0; s < SURAH_START_PAGES.length; s++) {
        if ((SURAH_START_PAGES[s] ?? 1) <= startPage) surahId = s + 1;
        else break;
      }
      return {
        juz: i + 1,
        startPage,
        startSurahName: getSurahMeta(surahId).name,
      };
    });
  },

  async loadChapters(): Promise<Map<number, MushafChapter>> {
    return loadChapters();
  },

  getCachedPage(page: number): MushafPageLayout | null {
    return getCachedMushafPage(clampMushafPage(page));
  },

  async loadPage(page: number): Promise<MushafPageLayout> {
    return loadMushafPage(clampMushafPage(page));
  },
} as const;
