/**
 * Web port of RN AsyncStorage `myBookmarks` — فواصل/إشارات المصحف.
 *
 * المرجع المستقر: آية `ayahKey` (سورة:آية).
 * الحقل `page` مشتق للعرض. السجلات القديمة (page فقط) تُهاجر عبر
 * خرائط mushaf=1 المضغوطة.
 */

import {
  findPageByFirstAyah,
  legacyPageFirstAyahKey,
  legacyPageToCurrentPageNum,
  pageFirstAyahMushaf1,
} from "@/lib/quran-data/ayah-page-index.generated";
import { recoverLocalJsonTmp, writeLocalJsonAtomic } from "@/lib/safe-json";

export const MY_BOOKMARKS_KEY = "myBookmarks";
export const MY_BOOKMARKS_MIGRATED_KEY = "myBookmarks:ayah-migrated-v1";

export type MyBookmark = {
  id: number;
  /** مرجع مستقر — لا ينزاح مع تغيير ترسيم الصفحات */
  ayahKey: string;
  /** رقم الصفحة الحالي المشتق من mushaf=1 (للعرض/التنقل) */
  page: number;
  label: string;
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

export function legacyPageToAyahKey(page: number): string {
  return legacyPageFirstAyahKey(page);
}

/** صفحة قديمة → صفحة mushaf=1 الحالية (عبر أول آية كانت على الصفحة) */
export function legacyPageToCurrentPage(page: number): number {
  return legacyPageToCurrentPageNum(page);
}

/** أول آية على صفحة mushaf=1 الحالية */
export function currentPageFirstAyah(page: number): string {
  return pageFirstAyahMushaf1(page);
}

/**
 * آية → صفحة: إن وُجدت كأول آية لصفحة؛ وإلا يُستخدم fallbackPage.
 */
export function ayahKeyToPage(ayahKey: string, fallbackPage?: number): number {
  const hit = findPageByFirstAyah(ayahKey);
  if (hit != null) return hit;
  if (typeof fallbackPage === "number") return clampPage(fallbackPage);
  return 1;
}

function normalizeBookmark(raw: LegacyBookmark): MyBookmark | null {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.id !== "number" || typeof raw.label !== "string" || typeof raw.date !== "string") {
    return null;
  }
  let ayahKey = isAyahKey(raw.ayahKey) ? raw.ayahKey : null;
  let page: number;
  if (!ayahKey) {
    if (typeof raw.page !== "number") return null;
    ayahKey = legacyPageToAyahKey(raw.page);
    page = legacyPageToCurrentPage(raw.page);
  } else {
    page =
      typeof raw.page === "number"
        ? clampPage(raw.page)
        : ayahKeyToPage(ayahKey);
  }
  return { id: raw.id, ayahKey, page, label: raw.label, date: raw.date };
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
    writeLocalJsonAtomic(MY_BOOKMARKS_KEY, next);
    localStorage.setItem(MY_BOOKMARKS_MIGRATED_KEY, "1");
    memBookmarks = next;
    memPageIndex = new Set(next.map((b) => b.page));
  } catch {
    /* ignore */
  }
}

let memBookmarks: MyBookmark[] | null = null;
let memPageIndex: Set<number> | null = null;

function setMem(list: MyBookmark[]): void {
  memBookmarks = list;
  memPageIndex = new Set(list.map((b) => b.page));
}

export function getMyBookmarks(): MyBookmark[] {
  if (typeof localStorage === "undefined") return [];
  if (memBookmarks) return memBookmarks;
  migrateStorageIfNeeded();
  recoverLocalJsonTmp(MY_BOOKMARKS_KEY);
  try {
    const existing = localStorage.getItem(MY_BOOKMARKS_KEY) || "[]";
    const parsed = JSON.parse(existing) as unknown;
    if (!Array.isArray(parsed)) {
      setMem([]);
      return [];
    }
    const list = parsed
      .map((b) => normalizeBookmark(b as LegacyBookmark))
      .filter((b): b is MyBookmark => b != null)
      .sort((a, b) => b.id - a.id);
    setMem(list);
    return list;
  } catch {
    setMem([]);
    return [];
  }
}

export async function saveBookmarks(bookmarks: MyBookmark[]): Promise<void> {
  try {
    const list = Array.isArray(bookmarks)
      ? bookmarks
          .map((b) => normalizeBookmark(b as LegacyBookmark))
          .filter((b): b is MyBookmark => b != null)
      : [];
    setMem(list);
    writeLocalJsonAtomic(MY_BOOKMARKS_KEY, list);
    localStorage.setItem(MY_BOOKMARKS_MIGRATED_KEY, "1");
  } catch (e) {
    console.error("خطأ في حفظ الفواصل", e);
  }
}

export async function addBookmark(page: number, label: string): Promise<MyBookmark | null> {
  try {
    migrateStorageIfNeeded();
    const p = clampPage(page);
    const ayahKey = currentPageFirstAyah(p);

    const newBookmark: MyBookmark = {
      id: Date.now(),
      ayahKey,
      page: p,
      label: (label || `صفحة ${p}`).trim(),
      date: new Date().toLocaleDateString("ar"),
    };
    const normalized = getMyBookmarks();
    const next = [...normalized, newBookmark];
    setMem(next);
    writeLocalJsonAtomic(MY_BOOKMARKS_KEY, next);
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
    setMem(next);
    writeLocalJsonAtomic(MY_BOOKMARKS_KEY, next);
  } catch (e) {
    console.error("خطأ في حذف الفاصل", e);
  }
}

export function isPageBookmarked(page: number): boolean {
  const p = clampPage(page);
  getMyBookmarks();
  return Boolean(memPageIndex?.has(p));
}

export function resetMyBookmarksCacheForTests(): void {
  memBookmarks = null;
  memPageIndex = null;
}
