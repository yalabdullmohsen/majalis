/**
 * فواصل المصحف — تخزين محلي (ayahKey مستقر، page مشتق).
 */

import { storageGetSync, storageSetSync } from "@/lib/native-storage";
import { recoverLocalJsonTmp, writeLocalJsonAtomic } from "@/lib/safe-json";
import { runOptimisticWalPersist } from "@/lib/sovereign/optimistic-wal";
import type { MushafBookmarkKind, MushafWirdSlot } from "@/lib/quran-bookmark-kinds";
import {
  ayahKeyToPage,
  currentPageFirstAyah,
  legacyPageToAyahKey,
  legacyPageToCurrentPage,
  clampMushafPageNum as clampPage,
} from "@/lib/quran-ayah-page";

export type { MushafBookmarkKind, MushafWirdSlot };
export {
  ayahKeyToPage,
  currentPageFirstAyah,
  legacyPageToAyahKey,
  legacyPageToCurrentPage,
} from "@/lib/quran-ayah-page";

export const MY_BOOKMARKS_KEY = "myBookmarks";
export const MY_BOOKMARKS_MIGRATED_KEY = "myBookmarks:ayah-migrated-v1";
export const MY_BOOKMARKS_MAX = 1000;

function isKind(v: unknown): v is MushafBookmarkKind {
  return (
    v === "wird" ||
    v === "hifz" ||
    v === "review" ||
    v === "tadabbur" ||
    v === "lesson" ||
    v === "custom"
  );
}

export type MyBookmark = {
  id: number;
  ayahKey: string;
  page: number;
  label: string;
  date: string;
  kind: MushafBookmarkKind;
  note?: string;
  customColor?: string;
  customName?: string;
  wirdSlot?: MushafWirdSlot;
  khatmaId?: string;
  archived?: boolean;
  favorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type LegacyBookmark = Partial<MyBookmark> & {
  id?: number;
  page?: number;
  label?: string;
  date?: string;
  ayahKey?: string;
  kind?: string;
  wirdSlot?: string;
};

let memBookmarks: MyBookmark[] | null = null;
let memPageIndex: Set<number> | null = null;

function setMem(list: MyBookmark[]): void {
  memBookmarks = list;
  memPageIndex = new Set(list.map((b) => b.page));
}

function persistList(list: MyBookmark[]): void {
  setMem(list);
  writeLocalJsonAtomic(MY_BOOKMARKS_KEY, list);
  try {
    storageSetSync(MY_BOOKMARKS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  try {
    storageSetSync(MY_BOOKMARKS_MIGRATED_KEY, "1");
  } catch {
    /* ignore */
  }
}

function isAyahKey(s: unknown): s is string {
  return typeof s === "string" && /^\d{1,3}:\d{1,3}$/.test(s);
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : undefined;
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
    page = typeof raw.page === "number" ? clampPage(raw.page) : ayahKeyToPage(ayahKey);
  }
  const kind: MushafBookmarkKind = isKind(raw.kind) ? raw.kind : "custom";
  const wirdSlot: MushafWirdSlot | undefined =
    raw.wirdSlot === "morning" || raw.wirdSlot === "evening" || raw.wirdSlot === "any"
      ? raw.wirdSlot
      : undefined;
  const customColor =
    typeof raw.customColor === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.customColor)
      ? raw.customColor
      : undefined;
  return {
    id: raw.id,
    ayahKey,
    page,
    label: raw.label,
    date: raw.date,
    kind,
    note: str(raw.note, 240),
    customColor,
    customName: str(raw.customName, 48),
    wirdSlot,
    khatmaId: str(raw.khatmaId, 64),
    archived: raw.archived === true,
    favorite: raw.favorite === true,
    createdAt: str(raw.createdAt, 40),
    updatedAt: str(raw.updatedAt, 40),
  };
}

function migrateStorageIfNeeded(): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (storageGetSync(MY_BOOKMARKS_MIGRATED_KEY) === "1" || localStorage.getItem(MY_BOOKMARKS_MIGRATED_KEY) === "1") {
      return;
    }
    const existing = storageGetSync(MY_BOOKMARKS_KEY) || localStorage.getItem(MY_BOOKMARKS_KEY) || "[]";
    const parsed = JSON.parse(existing) as unknown;
    if (!Array.isArray(parsed)) {
      storageSetSync(MY_BOOKMARKS_MIGRATED_KEY, "1");
      return;
    }
    const next = parsed
      .map((b) => normalizeBookmark(b as LegacyBookmark))
      .filter((b): b is MyBookmark => b != null);
    persistList(next);
  } catch {
    /* ignore */
  }
}

export function getMyBookmarks(): MyBookmark[] {
  if (typeof localStorage === "undefined") return [];
  if (memBookmarks) return memBookmarks;
  migrateStorageIfNeeded();
  recoverLocalJsonTmp(MY_BOOKMARKS_KEY);
  try {
    const existing = storageGetSync(MY_BOOKMARKS_KEY) || localStorage.getItem(MY_BOOKMARKS_KEY) || "[]";
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
    await runOptimisticWalPersist({
      store: MY_BOOKMARKS_KEY,
      entryId: `save-${list.length}`,
      apply: () => {
        setMem(list);
        return list;
      },
      persist: (snapshot) => {
        writeLocalJsonAtomic(MY_BOOKMARKS_KEY, snapshot);
        try {
          storageSetSync(MY_BOOKMARKS_KEY, JSON.stringify(snapshot));
          storageSetSync(MY_BOOKMARKS_MIGRATED_KEY, "1");
        } catch {
          /* ignore */
        }
      },
      rollback: () => {
        memBookmarks = null;
        memPageIndex = null;
        getMyBookmarks();
      },
    });
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
      kind: "custom",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [...getMyBookmarks(), newBookmark];
    persistList(next);
    return newBookmark;
  } catch (e) {
    console.error("خطأ في حفظ الفاصل", e);
    return null;
  }
}

export async function removeMyBookmark(id: number): Promise<void> {
  try {
    const prev = getMyBookmarks();
    const next = prev.filter((b) => b.id !== id);
    await runOptimisticWalPersist({
      store: MY_BOOKMARKS_KEY,
      entryId: `del-${id}`,
      op: "delete",
      apply: () => {
        setMem(next);
        return next;
      },
      persist: (snapshot) => {
        writeLocalJsonAtomic(MY_BOOKMARKS_KEY, snapshot);
        try {
          storageSetSync(MY_BOOKMARKS_KEY, JSON.stringify(snapshot));
        } catch {
          /* ignore */
        }
      },
      rollback: () => {
        setMem(prev);
      },
    });
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

export function getBookmarksOnPage(page: number): MyBookmark[] {
  const p = clampPage(page);
  return getMyBookmarks().filter((b) => !b.archived && b.page === p);
}

export function getBookmarksForAyah(ayahKey: string): MyBookmark[] {
  return getMyBookmarks().filter((b) => !b.archived && b.ayahKey === ayahKey);
}
