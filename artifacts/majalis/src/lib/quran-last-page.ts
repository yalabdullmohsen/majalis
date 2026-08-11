/**
 * Web port of RN AsyncStorage `lastPage` — last mushaf page number.
 *
 * ```ts
 * await saveLastPage(pageNumber);
 * const saved = await loadLastPage(); // number | null
 * ```
 */

export const LAST_PAGE_KEY = "lastPage";
export const MUSHAF_PAGE_MIN = 1;
export const MUSHAF_PAGE_MAX = 604;

export function clampMushafPage(page: number): number {
  if (!Number.isFinite(page)) return MUSHAF_PAGE_MIN;
  return Math.min(MUSHAF_PAGE_MAX, Math.max(MUSHAF_PAGE_MIN, Math.floor(page)));
}

/**
 * RN: saveLastPage — called on every currentPage change.
 */
export async function saveLastPage(pageNumber: number): Promise<void> {
  try {
    const page = clampMushafPage(pageNumber);
    localStorage.setItem(LAST_PAGE_KEY, page.toString());
    const userId =
      typeof window !== "undefined"
        ? (window as Window & { __MAJALIS_USER_ID__?: string | null }).__MAJALIS_USER_ID__
        : null;
    if (userId) {
      void import("@/lib/user-profile-service")
        .then((m) =>
          m.saveResumePosition(userId, {
            content_type: "mushaf_page",
            content_id: "last",
            content_title: `المصحف — صفحة ${page}`,
            content_url: `/mushaf/page/${page}`,
            thumbnail_icon: "book-open",
            position: { pct: page / 604, section: `page:${page}`, item_index: page },
          }),
        )
        .catch(() => undefined);
    }
  } catch (e) {
    console.error("خطأ في حفظ الصفحة", e);
  }
}

/**
 * RN: loadLastPage — restore on app/reader mount.
 * Returns null when missing or invalid (same as AsyncStorage getItem null).
 */
export async function loadLastPage(): Promise<number | null> {
  try {
    const savedPage = localStorage.getItem(LAST_PAGE_KEY);
    if (savedPage === null) return null;
    const n = parseInt(savedPage, 10);
    if (!Number.isFinite(n)) return null;
    return clampMushafPage(n);
  } catch (e) {
    console.error("خطأ في استعادة الصفحة", e);
    return null;
  }
}

/** Sync read for initial React state (avoids flash before async load). */
export function loadLastPageSync(): number | null {
  try {
    const savedPage = localStorage.getItem(LAST_PAGE_KEY);
    if (savedPage === null) return null;
    const n = parseInt(savedPage, 10);
    if (!Number.isFinite(n)) return null;
    return clampMushafPage(n);
  } catch {
    return null;
  }
}
