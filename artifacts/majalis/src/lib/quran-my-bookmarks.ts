/**
 * Web port of RN AsyncStorage `myBookmarks` — فواصل/إشارات المصحف.
 *
 * المرجع المستقر: آية `ayahKey` (سورة:آية) — لا ينزاح مع ترسيم الصفحات.
 * الحقل `page` مشتق للعرض. السجلات القديمة (page فقط) تُهاجر عبر
 * LEGACY_PAGE_FIRST_AYAH عند القراءة.
 */

import {
  AYAH_TO_PAGE_MUSHAF1,
  LEGACY_PAGE_FIRST_AYAH,
  PAGE_FIRST_AYAH_MUSHAF1,
} from "@/lib/mushaf-ayah-page-index.generated";

export const MY_BOOKMARKS_KEY = "myBookmarks";
export const MY_BOOKMARKS_MIGRATED_KEY = "myBookmarks:ayah-migrated-v1";

export type MyBookmark = {
  id: number;
  /** مرجع مستقر — لا ينزاح مع تغيير ترسيم الصفحات */
  ayahKey: string;
  /** رقم الصفحة الحالي المشتق من mushaf=1 (للعرض/التنقل) */
  page: number;
  label: string;
  /** Locale date string (RN `toLocaleDateString()`). */
  date: string;
};

type LegacyBookmark = {
  id?: number;
  page?: number;
  label?: string;
  date?: string;
  ayahKey?: string;
};

function clampPage(page: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(604, Math.max(1, Math.floor(page)));
}

function isAyahKey(s: unknown): s is string {
  return typeof s === "string" && /^\d{1,3}:\d{1,3}$/.test(s);
}

/** صفحة → أول آية كانت عليها قبل اعتماد mushaf=1 */
export function legacyPageToAyahKey(page: number): string {
  const p = clampPage(page);
  return LEGACY_PAGE_FIRST_AYAH[p] ?? "1:1";
}

/** آية → رقم صفحة mushaf=1 الحالي */
export function ayahKeyToPage(ayahKey: string): number {
  return AYAH_TO_PAGE_MUSHAF1[ayahKey] ?? 1;
}

/** أول آية على صفحة mushaf=1 الحالية */
export function currentPageFirstAyah(page: number): string {
  const p = clampPage(page);
  return PAGE_FIRST_AYAH_MUSHAF1[p] ?? legacyPageToAyahKey(p);
}

function normalizeBookmark(raw: LegacyBookmark): MyBookmark | null {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.id !== "number" || typeof raw.label !== "string" || typeof raw.date !== "string") {
    return null;
  }
  let ayahKey = isAyahKey(raw.ayahKey) ? raw.ayahKey : null;
  if (!ayahKey) {
    if (typeof raw.page !== "number") return null;
    ayahKey = legacyPageToAyahKey(raw.page);
  }
  return {
    id: raw.id,
    ayahKey,
    page: ayahKeyToPage(ayahKey),
    label: raw.label,
    date: raw.date,
  };
}

function migrateStorageIfNeeded(): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (localStorage.getItem(MY_BOOKMARKS_MIGRATED_KEY) === "1") return;
    const existing = localStorage.getItem(MY_BOOKMARKS_KEY) || "[]";
    const parsed = JSON.parse(existing) as unknown;
    if (!Array.isArray(parsed)) {
      localStorage.setItem(MY_BOOKMARKS_MIGRATED_KEY, "1");
      return;
    }
    const next = parsed
      .map((b) => normalizeBookmark(b as LegacyBookmark))
      .filter((b): b is MyBookmark => b != null);
    localStorage.setItem(MY_BOOKMARKS_KEY, JSON.stringify(next));
    localStorage.setItem(MY_BOOKMARKS_MIGRATED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function getMyBookmarks(): MyBookmark[] {
  if (typeof localStorage === "undefined") return [];
  migrateStorageIfNeeded();
  try {
    const existing = localStorage.getItem(MY_BOOKMARKS_KEY) || "[]";
    const parsed = JSON.parse(existing) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((b) => normalizeBookmark(b as LegacyBookmark))
      .filter((b): b is MyBookmark => b != null)
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
      ? bookmarks
          .map((b) => normalizeBookmark(b as LegacyBookmark))
          .filter((b): b is MyBookmark => b != null)
      : [];
    localStorage.setItem(MY_BOOKMARKS_KEY, JSON.stringify(list));
    localStorage.setItem(MY_BOOKMARKS_MIGRATED_KEY, "1");
  } catch (e) {
    console.error("خطأ في حفظ الفواصل", e);
  }
}

/**
 * RN: addBookmark(page, label) — يحفظ بمرجع آية (أول آية على الصفحة الحالية).
 */
export async function addBookmark(page: number, label: string): Promise<MyBookmark | null> {
  try {
    migrateStorageIfNeeded();
    const existing = localStorage.getItem(MY_BOOKMARKS_KEY) || "[]";
    const bookmarks = JSON.parse(existing) as LegacyBookmark[];
    if (!Array.isArray(bookmarks)) throw new Error("invalid myBookmarks shape");

    const p = clampPage(page);
    const ayahKey = currentPageFirstAyah(p);

    const newBookmark: MyBookmark = {
      id: Date.now(),
      ayahKey,
      page: ayahKeyToPage(ayahKey),
      label: (label || `صفحة ${p}`).trim(),
      date: new Date().toLocaleDateString("ar"),
    };
    const normalized = bookmarks
      .map((b) => normalizeBookmark(b))
      .filter((b): b is MyBookmark => b != null);
    localStorage.setItem(MY_BOOKMARKS_KEY, JSON.stringify([...normalized, newBookmark]));
    localStorage.setItem(MY_BOOKMARKS_MIGRATED_KEY, "1");
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
