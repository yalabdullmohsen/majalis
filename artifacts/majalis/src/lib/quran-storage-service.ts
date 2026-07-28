/**
 * Web port of RN AsyncStorage `storageService`:
 *
 * ```ts
 * export const storageService = {
 *   saveLastPage: async (page) => await AsyncStorage.setItem('lastPage', page.toString()),
 *   getLastPage: async () => await AsyncStorage.getItem('lastPage'),
 *   saveBookmarks: async (bookmarks) => await AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarks)),
 *   getBookmarks: async () => {
 *     const data = await AsyncStorage.getItem('bookmarks');
 *     return data ? JSON.parse(data) : [];
 *   },
 * };
 * ```
 *
 * Web: `localStorage` with live keys `lastPage` + `myBookmarks` (not a second store).
 */

import {
  LAST_PAGE_KEY,
  clampMushafPage,
  loadLastPage,
  loadLastPageSync,
  saveLastPage as persistLastPage,
} from "@/lib/quran-last-page";
import {
  getMyBookmarks,
  saveBookmarks as persistBookmarks,
  type MyBookmark,
} from "@/lib/quran-my-bookmarks";

export type { MyBookmark };

export const storageService = {
  // ── حفظ واستعادة آخر صفحة ──────────────────────────────────────────────
  saveLastPage: async (page: number): Promise<void> => {
    await persistLastPage(page);
  },

  /** مثل AsyncStorage.getItem — يعيد النص أو null. */
  getLastPage: async (): Promise<string | null> => {
    try {
      const raw = localStorage.getItem(LAST_PAGE_KEY);
      if (raw == null) return null;
      const n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n)) return null;
      return clampMushafPage(n).toString();
    } catch {
      return null;
    }
  },

  getLastPageNumber: async (): Promise<number | null> => loadLastPage(),
  getLastPageNumberSync: (): number | null => loadLastPageSync(),

  // ── إدارة الفواصل المتعددة ─────────────────────────────────────────────
  saveBookmarks: async (bookmarks: MyBookmark[]): Promise<void> => {
    await persistBookmarks(bookmarks);
  },

  getBookmarks: async (): Promise<MyBookmark[]> => {
    try {
      return getMyBookmarks();
    } catch {
      return [];
    }
  },
} as const;

export default storageService;
