/**
 * RN constants.js — surah index entries `{ id, name, page }`.
 * Pages follow Mushaf al-Madinah (Hafs) via SURAH_START_PAGES.
 */

import { SURAH_START_PAGES, getSurahList } from "@/lib/quran-api";

export type SurahListItem = {
  id: number;
  name: string;
  /** First mushaf page of the surah (1–604). */
  page: number;
};

/** Full 114-surah index for FlatList-style catalogs. */
export const surahList: readonly SurahListItem[] = getSurahList().map((s) => ({
  id: s.number,
  name: s.name,
  page: SURAH_START_PAGES[s.number - 1] ?? 1,
}));

export function getSurahListItem(id: number): SurahListItem | undefined {
  if (id < 1 || id > 114) return undefined;
  return surahList[id - 1];
}

/** RN navigateToPage(item.page) → mushaf page route. */
export function mushafPageHref(page: number): string {
  const p = Math.min(604, Math.max(1, Math.floor(Number(page)) || 1));
  return `/mushaf/page/${p}`;
}

export function mushafSurahHref(surahId: number): string {
  const id = Math.min(114, Math.max(1, Math.floor(Number(surahId)) || 1));
  return `/mushaf/${id}`;
}
