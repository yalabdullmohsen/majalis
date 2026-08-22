/**
 * Web port of RN AsyncStorage `lastPage` — last mushaf page number.
 *
 * ```ts
 * await saveLastPage(pageNumber);
 * const saved = await loadLastPage(); // number | null
 * ```
 */
import { toLatinDigits } from "@/lib/numerals";

export const LAST_PAGE_KEY = "lastPage";
export const MUSHAF_PAGE_MIN = 1;
export const MUSHAF_PAGE_MAX = 604;
/** المصدر المركزي لعدد صفحات المصحف — مرادف لـ MUSHAF_PAGE_MAX. */
export const TOTAL_QURAN_PAGES = MUSHAF_PAGE_MAX;

export function clampMushafPage(page: number): number {
  if (!Number.isFinite(page)) return MUSHAF_PAGE_MIN;
  return Math.min(MUSHAF_PAGE_MAX, Math.max(MUSHAF_PAGE_MIN, Math.floor(page)));
}

/** يحوّل 255 / ٢٥٥ / ۲۵۵ إلى رقم موحّد، أو null إن لم يكن رقم صفحة خالصًا. */
export function parseMushafPageQuery(raw: string): number | null {
  const western = toLatinDigits(raw.trim());
  if (!/^\d+$/.test(western)) return null;
  const n = Number.parseInt(western, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * RN: saveLastPage — called on every currentPage change.
 */
export async function saveLastPage(pageNumber: number): Promise<void> {
  try {
    const page = clampMushafPage(pageNumber);
    const { storageSetSync } = await import("@/lib/native-storage");
    storageSetSync(LAST_PAGE_KEY, page.toString());
    // Background cloud resume for signed-in users (hybrid local→cloud)
    void (async () => {
      try {
        const { getSupabaseClient } = await import("@/lib/supabase-bootstrap");
        const client = getSupabaseClient();
        const {
          data: { user },
        } = await client.auth.getUser();
        if (!user?.id) return;
        const { saveResumePosition } = await import("@/lib/user-profile-service");
        await saveResumePosition(user.id, {
          content_type: "mushaf_page",
          content_id: String(page),
          content_title: `المصحف — صفحة ${page}`,
          content_url: `/mushaf?page=${page}`,
          thumbnail_icon: "BookOpen",
          position: { item_index: page },
        });
        const { enqueueOutbox } = await import("@/lib/sync-outbox");
        await enqueueOutbox("reading_progress", `mushaf:${user.id}`, {
          userId: user.id,
          page,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        /* offline / unsigned */
      }
    })();
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
    const { storageGetSync } = await import("@/lib/native-storage");
    const savedPage = storageGetSync(LAST_PAGE_KEY);
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
    // sync path — localStorage (Preferences تُزامَن عند الإقلاع عبر hydrateNativeStorage)
    const savedPage =
      typeof localStorage !== "undefined" ? localStorage.getItem(LAST_PAGE_KEY) : null;
    if (savedPage === null) return null;
    const n = parseInt(savedPage, 10);
    if (!Number.isFinite(n)) return null;
    return clampMushafPage(n);
  } catch {
    return null;
  }
}
