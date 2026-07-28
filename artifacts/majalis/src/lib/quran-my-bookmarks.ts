/**
 * Web port of RN AsyncStorage `myBookmarks` — page separators / bookmarks.
 *
 * ```ts
 * await addBookmark(page, label);
 * ```
 */

export const MY_BOOKMARKS_KEY = "myBookmarks";

export type MyBookmark = {
  id: number;
  page: number;
  label: string;
  /** Locale date string (RN `toLocaleDateString()`). */
  date: string;
};

function clampPage(page: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(604, Math.max(1, Math.floor(page)));
}

export function getMyBookmarks(): MyBookmark[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const existing = localStorage.getItem(MY_BOOKMARKS_KEY) || "[]";
    const parsed = JSON.parse(existing) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((b): b is MyBookmark => {
        if (!b || typeof b !== "object") return false;
        const row = b as Record<string, unknown>;
        return (
          typeof row.id === "number" &&
          typeof row.page === "number" &&
          typeof row.label === "string" &&
          typeof row.date === "string"
        );
      })
      .map((b) => ({ ...b, page: clampPage(b.page) }))
      .sort((a, b) => b.id - a.id);
  } catch {
    return [];
  }
}

/**
 * RN storageService.saveBookmarks — replace the whole `myBookmarks` list.
 */
export async function saveBookmarks(bookmarks: MyBookmark[]): Promise<void> {
  try {
    const list = Array.isArray(bookmarks)
      ? bookmarks.map((b) => ({
          id: typeof b.id === "number" ? b.id : Date.now(),
          page: clampPage(b.page),
          label: typeof b.label === "string" ? b.label : `صفحة ${clampPage(b.page)}`,
          date: typeof b.date === "string" ? b.date : new Date().toLocaleDateString("ar"),
        }))
      : [];
    localStorage.setItem(MY_BOOKMARKS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("خطأ في حفظ الفواصل", e);
  }
}

/**
 * RN: addBookmark(page, label) — appends `{ id, page, label, date }` to `myBookmarks`.
 */
export async function addBookmark(page: number, label: string): Promise<MyBookmark | null> {
  try {
    const existing = localStorage.getItem(MY_BOOKMARKS_KEY) || "[]";
    const bookmarks = JSON.parse(existing) as MyBookmark[];
    if (!Array.isArray(bookmarks)) throw new Error("invalid myBookmarks shape");

    const newBookmark: MyBookmark = {
      id: Date.now(),
      page: clampPage(page),
      label: (label || `صفحة ${clampPage(page)}`).trim(),
      date: new Date().toLocaleDateString("ar"),
    };
    const updatedBookmarks = [...bookmarks, newBookmark];
    localStorage.setItem(MY_BOOKMARKS_KEY, JSON.stringify(updatedBookmarks));
    return newBookmark;
  } catch (e) {
    console.error("خطأ في حفظ الفاصل", e);
    return null;
  }
}

export async function removeMyBookmark(id: number): Promise<void> {
  try {
    const next = getMyBookmarks().filter((b) => b.id !== id);
    localStorage.setItem(MY_BOOKMARKS_KEY, JSON.stringify(next));
  } catch (e) {
    console.error("خطأ في حذف الفاصل", e);
  }
}

export function isPageBookmarked(page: number): boolean {
  const p = clampPage(page);
  return getMyBookmarks().some((b) => b.page === p);
}
