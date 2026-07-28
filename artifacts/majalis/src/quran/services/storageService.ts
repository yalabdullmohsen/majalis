/**
 * RN sketch `storageService` — localStorage web port of AsyncStorage.
 * Reuses existing `lastPage` + `myBookmarks` stores (no second bookmark key).
 *
 * ```ts
 * await storageService.saveLastPage(page);
 * const raw = await storageService.getLastPage(); // string | null
 * await storageService.saveBookmarks(list);
 * const list = await storageService.getBookmarks();
 * ```
 */

import {
  LAST_PAGE_KEY,
  saveLastPage as persistLastPage,
  loadLastPage,
  loadLastPageSync,
} from "@/lib/quran-last-page";
import {
  MY_BOOKMARKS_KEY,
  type MyBookmark,
  getMyBookmarks,
} from "@/lib/quran-my-bookmarks";

export type { MyBookmark };

export const storageService = {
  /** RN: AsyncStorage.setItem('lastPage', page.toString()) */
  saveLastPage: async (page: number): Promise<void> => {
    await persistLastPage(page);
  },

  /**
   * RN: AsyncStorage.getItem('lastPage') — raw string | null.
   * Prefer {@link getLastPageNumber} when a clamped number is needed.
   */
  getLastPage: async (): Promise<string | null> => {
    try {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(LAST_PAGE_KEY);
    } catch {
      return null;
    }
  },

  /** Typed helper (not in RN sketch) — clamped page or null. */
  getLastPageNumber: async (): Promise<number | null> => loadLastPage(),

  /** Sync read for React initial state. */
  getLastPageNumberSync: (): number | null => loadLastPageSync(),

  /** RN: AsyncStorage.setItem('bookmarks', …) → web key `myBookmarks`. */
  saveBookmarks: async (bookmarks: MyBookmark[]): Promise<void> => {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(MY_BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.error("خطأ في حفظ الفواصل", e);
    }
  },

  /** RN: getItem + JSON.parse → [] ; web key `myBookmarks`. */
  getBookmarks: async (): Promise<MyBookmark[]> => getMyBookmarks(),
};

export default storageService;
