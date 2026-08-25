/**
 * مفضّلات محلية للجهاز — بديل آمن دون حساب.
 * لا تُخزَّن بيانات حسّاسة؛ فقط نوع المحتوى والمعرّف والعنوان والمسار.
 * كاش ذاكرة + فهرس Set لفحص O(1)؛ كتابة ذرية عبر safe-json.
 */

import {
  readLocalJson,
  writeLocalJson,
  recoverLocalJsonTmp,
  isPlainObject,
} from "@/lib/safe-json";

const STORAGE_KEY = "majalis-local-bookmarks-v1";
const MAX_ITEMS = 80;

export type LocalBookmark = {
  id: string;
  contentType: string;
  contentId: string;
  title: string;
  href: string;
  savedAt: string;
};

function bookmarkKey(contentType: string, contentId: string): string {
  return `${contentType}::${contentId}`;
}

function isBookmark(v: unknown): v is LocalBookmark {
  return (
    isPlainObject(v) &&
    typeof v.id === "string" &&
    typeof v.contentType === "string" &&
    typeof v.contentId === "string" &&
    typeof v.title === "string" &&
    typeof v.href === "string" &&
    typeof v.savedAt === "string"
  );
}

function isBookmarkList(v: unknown): v is LocalBookmark[] {
  return Array.isArray(v) && v.every(isBookmark);
}

let memList: LocalBookmark[] | null = null;
let memIndex: Set<string> | null = null;

function rebuildIndex(items: LocalBookmark[]): Set<string> {
  const set = new Set<string>();
  for (const b of items) set.add(bookmarkKey(b.contentType, b.contentId));
  return set;
}

function readAll(): LocalBookmark[] {
  if (typeof window === "undefined") return [];
  if (memList) return memList;
  recoverLocalJsonTmp(STORAGE_KEY);
  const items = readLocalJson<LocalBookmark[]>(STORAGE_KEY, [], isBookmarkList);
  memList = items;
  memIndex = rebuildIndex(items);
  return items;
}

function writeAll(items: LocalBookmark[]) {
  if (typeof window === "undefined") return;
  const trimmed = items.slice(0, MAX_ITEMS);
  memList = trimmed;
  memIndex = rebuildIndex(trimmed);
  writeLocalJson(STORAGE_KEY, trimmed);
  // مرآة Dexie — لا تُعطّل المسار المتزامن إن فشل IndexedDB
  void import("@/lib/offline-bookmarks")
    .then((m) => m.persistOfflineBookmarks(trimmed))
    .catch(() => undefined);
}

export function listLocalBookmarks(): LocalBookmark[] {
  return readAll().slice().sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function isLocalBookmarked(contentType: string, contentId: string): boolean {
  readAll();
  return Boolean(memIndex?.has(bookmarkKey(contentType, contentId)));
}

export function toggleLocalBookmark(input: {
  contentType: string;
  contentId: string;
  title?: string;
  href?: string;
}): boolean {
  const list = readAll().slice();
  const idx = list.findIndex(
    (b) => b.contentType === input.contentType && b.contentId === input.contentId,
  );
  if (idx >= 0) {
    list.splice(idx, 1);
    writeAll(list);
    return false;
  }
  const href =
    input.href ||
    (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/");
  list.unshift({
    id: `lb-${input.contentType}-${input.contentId}-${Date.now()}`,
    contentType: input.contentType,
    contentId: input.contentId,
    title: (input.title || "").trim() || `${input.contentType}/${input.contentId}`,
    href,
    savedAt: new Date().toISOString(),
  });
  writeAll(list);
  return true;
}

export function removeLocalBookmark(contentType: string, contentId: string): void {
  writeAll(readAll().filter((b) => !(b.contentType === contentType && b.contentId === contentId)));
}

export function clearLocalBookmarks(): void {
  if (typeof window === "undefined") return;
  memList = [];
  memIndex = new Set();
  localStorage.removeItem(STORAGE_KEY);
  try {
    localStorage.removeItem(`${STORAGE_KEY}::__tmp`);
  } catch {
    /* ignore */
  }
  void import("@/lib/offline-bookmarks")
    .then((m) => m.clearOfflineBookmarks())
    .catch(() => undefined);
}

/** للاختبارات فقط */
export function resetLocalBookmarksCacheForTests(): void {
  memList = null;
  memIndex = null;
}

/** قراءة offline-first: IndexedDB ثم localStorage. */
export async function listBookmarksOfflineFirst(): Promise<LocalBookmark[]> {
  try {
    const { listOfflineBookmarks, migrateLocalBookmarksToIdb } = await import(
      "@/lib/offline-bookmarks"
    );
    const local = readAll();
    await migrateLocalBookmarksToIdb(local);
    const idb = await listOfflineBookmarks();
    if (idb.length) return idb;
    return local.slice().sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
  } catch {
    return listLocalBookmarks();
  }
}
