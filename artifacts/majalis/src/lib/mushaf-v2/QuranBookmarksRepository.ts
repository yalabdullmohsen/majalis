/**
 * QuranBookmarksRepository — فواصل المصحف + مفضلة الآيات + ملاحظات.
 */

import {
  addBookmark as addPageBookmark,
  getMyBookmarks,
  isPageBookmarked,
  removeMyBookmark,
  type MyBookmark,
} from "@/lib/quran-my-bookmarks";
import {
  addBookmark as addFavoriteAyah,
  getNote,
  isBookmarked as isFavoriteAyah,
  removeBookmark as removeFavoriteAyah,
  saveNote,
} from "@/lib/quran-personal";
import { getSurahMeta as getSurahMetaFromApi } from "@/lib/quran-api";
import { loadLastPageSync } from "@/lib/quran-last-page";

export type BookmarkSnapshot = {
  lastPage: number | null;
  bookmarks: MyBookmark[];
};

export const QuranBookmarksRepository = {
  getLastPage(): number | null {
    return loadLastPageSync();
  },

  listBookmarks(): MyBookmark[] {
    return getMyBookmarks();
  },

  isBookmarked(page: number): boolean {
    return isPageBookmarked(page);
  },

  async addPageBookmark(page: number, label: string): Promise<MyBookmark | null> {
    return addPageBookmark(page, label);
  },

  async removeBookmark(id: number): Promise<void> {
    return removeMyBookmark(id);
  },

  isFavorite(surah: number, ayah: number): boolean {
    return isFavoriteAyah(surah, ayah);
  },

  addFavorite(surah: number, ayah: number, text = ""): void {
    const meta = getSurahMetaFromApi(surah);
    addFavoriteAyah({
      surahNum: surah,
      ayahNum: ayah,
      surahName: meta.name,
      text,
    });
  },

  removeFavorite(surah: number, ayah: number): void {
    removeFavoriteAyah(surah, ayah);
  },

  getNote(surah: number, ayah: number): string {
    return getNote(surah, ayah);
  },

  saveNote(surah: number, ayah: number, text: string): void {
    saveNote(surah, ayah, text);
  },

  snapshot(): BookmarkSnapshot {
    return {
      lastPage: loadLastPageSync(),
      bookmarks: getMyBookmarks(),
    };
  },
} as const;
