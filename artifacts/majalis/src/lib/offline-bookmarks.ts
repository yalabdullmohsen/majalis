/**
 * إشارات/مفضّلات في Dexie (IndexedDB) — مرآة لـ localStorage مع قراءة offline-first.
 */
import { idbDelete, idbGetAll, idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import type { LocalBookmark } from "@/lib/local-bookmarks";

const BOOKMARKS_INDEX_KEY = "index-v1";
const MAX_ITEMS = 80;

function bookmarkRowKey(contentType: string, contentId: string): string {
  return `${contentType}::${contentId}`;
}

export async function listOfflineBookmarks(): Promise<LocalBookmark[]> {
  try {
    const index = await idbGetValue<LocalBookmark[]>(OFFLINE_STORES.bookmarks, BOOKMARKS_INDEX_KEY);
    if (index?.length) {
      return [...index].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
    }
    const rows = await idbGetAll<LocalBookmark>(OFFLINE_STORES.bookmarks);
    return rows
      .filter((r) => r.key !== BOOKMARKS_INDEX_KEY && r.value?.contentId)
      .map((r) => r.value)
      .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
  } catch {
    return [];
  }
}

export async function persistOfflineBookmarks(items: LocalBookmark[]): Promise<void> {
  const trimmed = items.slice(0, MAX_ITEMS);
  await idbPut(OFFLINE_STORES.bookmarks, BOOKMARKS_INDEX_KEY, trimmed);
  for (const item of trimmed) {
    await idbPut(
      OFFLINE_STORES.bookmarks,
      bookmarkRowKey(item.contentType, item.contentId),
      item,
    );
  }
}

export async function upsertOfflineBookmark(item: LocalBookmark): Promise<void> {
  const list = await listOfflineBookmarks();
  const next = [
    item,
    ...list.filter(
      (b) => !(b.contentType === item.contentType && b.contentId === item.contentId),
    ),
  ].slice(0, MAX_ITEMS);
  await persistOfflineBookmarks(next);
}

export async function removeOfflineBookmark(
  contentType: string,
  contentId: string,
): Promise<void> {
  const list = (await listOfflineBookmarks()).filter(
    (b) => !(b.contentType === contentType && b.contentId === contentId),
  );
  await idbDelete(OFFLINE_STORES.bookmarks, bookmarkRowKey(contentType, contentId));
  await persistOfflineBookmarks(list);
}

export async function clearOfflineBookmarks(): Promise<void> {
  const rows = await idbGetAll(OFFLINE_STORES.bookmarks);
  for (const row of rows) {
    await idbDelete(OFFLINE_STORES.bookmarks, row.key);
  }
}

/** ينقل مفضّلات localStorage إلى Dexie إن كان مخزن IndexedDB فارغًا. */
export async function migrateLocalBookmarksToIdb(
  localItems: LocalBookmark[],
): Promise<number> {
  if (!localItems.length) return 0;
  const existing = await listOfflineBookmarks();
  if (existing.length > 0) return 0;
  await persistOfflineBookmarks(localItems);
  return localItems.length;
}
