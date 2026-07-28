/**
 * Smart Multi-Purpose Dynamic Bookmarks Engine.
 * Typed bookmarks: Daily Wird, Memorization, Tadabbur, Review, Favorite…
 * Persists in IndexedDB + LS; zero-latency restore from LS mirror.
 */

import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import {
  addBookmark as addLegacyBookmark,
  getBookmarks as getLegacyBookmarks,
  removeBookmark as removeLegacyBookmark,
  type QuranBookmark,
} from "@/lib/quran-personal";
import { getSurahMeta } from "@/lib/quran-api";

export type BookmarkType =
  | "favorite"
  | "daily_wird"
  | "memorization"
  | "tadabbur"
  | "review"
  | "custom";

export const BOOKMARK_TYPE_LABELS: Record<BookmarkType, string> = {
  favorite: "المفضلة",
  daily_wird: "الورد اليومي",
  memorization: "هدف الحفظ",
  tadabbur: "تدبّر",
  review: "مراجعة",
  custom: "مخصص",
};

export type TypedBookmark = {
  id: string;
  type: BookmarkType;
  /** Custom label when type=custom */
  label?: string;
  surah: number;
  ayah: number;
  page?: number;
  surahName: string;
  textSnippet?: string;
  createdAt: number;
  updatedAt: number;
};

export type BookmarkPositionMarker = {
  id: string;
  type: BookmarkType;
  surah: number;
  ayah: number;
  page?: number;
};

const LS_KEY = "majalis-typed-bookmarks-v1";
const IDB_KEY = "typed-bookmarks-v1";
const POSITIONS_LS = "majalis-bookmark-positions-v1";

function uid(): string {
  return `tbk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function readLs(): TypedBookmark[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLs(list: TypedBookmark[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 500)));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, list).catch(() => undefined);
}

export function loadTypedBookmarks(): TypedBookmark[] {
  return readLs().sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadTypedBookmarksAsync(): Promise<TypedBookmark[]> {
  try {
    const fromIdb = await idbGetValue<TypedBookmark[]>(OFFLINE_STORES.meta, IDB_KEY);
    if (Array.isArray(fromIdb) && fromIdb.length) {
      writeLs(fromIdb);
      return fromIdb.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  } catch {
    /* fall through */
  }
  return loadTypedBookmarks();
}

export function getBookmarksByType(type: BookmarkType): TypedBookmark[] {
  return loadTypedBookmarks().filter((b) => b.type === type);
}

export function upsertTypedBookmark(input: {
  id?: string;
  type: BookmarkType;
  label?: string;
  surah: number;
  ayah: number;
  page?: number;
  textSnippet?: string;
}): TypedBookmark {
  const now = Date.now();
  const list = readLs();
  const surahName = getSurahMeta(input.surah).name;
  let row: TypedBookmark;

  if (input.id) {
    const idx = list.findIndex((b) => b.id === input.id);
    if (idx >= 0) {
      row = {
        ...list[idx],
        ...input,
        surahName,
        updatedAt: now,
      };
      list[idx] = row;
    } else {
      row = {
        id: input.id,
        type: input.type,
        label: input.label,
        surah: input.surah,
        ayah: input.ayah,
        page: input.page,
        surahName,
        textSnippet: input.textSnippet,
        createdAt: now,
        updatedAt: now,
      };
      list.unshift(row);
    }
  } else {
    // One bookmark per type+ayah (replace)
    const filtered = list.filter(
      (b) => !(b.type === input.type && b.surah === input.surah && b.ayah === input.ayah),
    );
    row = {
      id: uid(),
      type: input.type,
      label: input.label,
      surah: input.surah,
      ayah: input.ayah,
      page: input.page,
      surahName,
      textSnippet: input.textSnippet,
      createdAt: now,
      updatedAt: now,
    };
    filtered.unshift(row);
    writeLs(filtered);
    mirrorLegacy(row);
    savePositionMarker(row);
    return row;
  }

  writeLs(list);
  mirrorLegacy(row);
  savePositionMarker(row);
  return row;
}

function mirrorLegacy(row: TypedBookmark): void {
  try {
    const listName = BOOKMARK_TYPE_LABELS[row.type];
    addLegacyBookmark(
      {
        surahNum: row.surah,
        ayahNum: row.ayah,
        surahName: row.surahName,
        text: row.textSnippet || "",
      },
      listName,
    );
  } catch {
    /* ignore */
  }
}

export function removeTypedBookmark(id: string): void {
  const list = readLs();
  const target = list.find((b) => b.id === id);
  writeLs(list.filter((b) => b.id !== id));
  if (target) {
    try {
      removeLegacyBookmark(target.surah, target.ayah);
    } catch {
      /* ignore */
    }
    clearPositionMarker(target.type);
  }
}

function savePositionMarker(row: TypedBookmark): void {
  try {
    const raw = localStorage.getItem(POSITIONS_LS);
    const map = raw ? (JSON.parse(raw) as Record<string, BookmarkPositionMarker>) : {};
    map[row.type] = {
      id: row.id,
      type: row.type,
      surah: row.surah,
      ayah: row.ayah,
      page: row.page,
    };
    localStorage.setItem(POSITIONS_LS, JSON.stringify(map));
    void idbPut(OFFLINE_STORES.meta, "bookmark-positions-v1", map).catch(() => undefined);
  } catch {
    /* ignore */
  }
}

function clearPositionMarker(type: BookmarkType): void {
  try {
    const raw = localStorage.getItem(POSITIONS_LS);
    const map = raw ? (JSON.parse(raw) as Record<string, BookmarkPositionMarker>) : {};
    delete map[type];
    localStorage.setItem(POSITIONS_LS, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Zero-latency restore of last marker per type from LS. */
export function restoreBookmarkPosition(type: BookmarkType): BookmarkPositionMarker | null {
  try {
    const raw = localStorage.getItem(POSITIONS_LS);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, BookmarkPositionMarker>;
    return map[type] || null;
  } catch {
    return null;
  }
}

export function restoreAllBookmarkPositions(): Record<string, BookmarkPositionMarker> {
  try {
    const raw = localStorage.getItem(POSITIONS_LS);
    return raw ? (JSON.parse(raw) as Record<string, BookmarkPositionMarker>) : {};
  } catch {
    return {};
  }
}

/** Migrate legacy favorite bookmarks into typed engine once. */
export function migrateLegacyBookmarks(): number {
  const existing = readLs();
  if (existing.length) return 0;
  let n = 0;
  try {
    const legacy: QuranBookmark[] = getLegacyBookmarks();
    for (const b of legacy) {
      upsertTypedBookmark({
        type: b.list === BOOKMARK_TYPE_LABELS.tadabbur ? "tadabbur" : "favorite",
        surah: b.surahNum,
        ayah: b.ayahNum,
        textSnippet: b.text,
      });
      n += 1;
    }
  } catch {
    return n;
  }
  return n;
}
