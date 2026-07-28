/**
 * مفضّلات محلية للجهاز — بديل آمن دون حساب.
 * Part 20: Map-indexed O(1) lookups (monomorphic) + outbox idempotency on mutate.
 */

import { readLocalJson, writeLocalJson, isPlainObject } from "@/lib/safe-json";
import { bookmarkLookupKey, indexByKey } from "@/lib/stable-shapes";
import { enqueueOutbox } from "@/lib/offline-outbox";
import { scheduleInputAck } from "@/lib/yield-to-main";

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

let indexCache: Map<string, LocalBookmark> | null = null;
let listCache: LocalBookmark[] | null = null;

function readAll(): LocalBookmark[] {
  if (typeof window === "undefined") return [];
  if (listCache) return listCache;
  listCache = readLocalJson<LocalBookmark[]>(STORAGE_KEY, [], isBookmarkList);
  indexCache = indexByKey(listCache, (b) => bookmarkLookupKey(b.contentType, b.contentId));
  return listCache;
}

function getIndex(): Map<string, LocalBookmark> {
  if (!indexCache) {
    readAll();
  }
  return indexCache ?? new Map();
}

function writeAll(items: LocalBookmark[]) {
  if (typeof window === "undefined") return;
  const next = items.slice(0, MAX_ITEMS);
  writeLocalJson(STORAGE_KEY, next);
  listCache = next;
  indexCache = indexByKey(next, (b) => bookmarkLookupKey(b.contentType, b.contentId));
}

export function listLocalBookmarks(): LocalBookmark[] {
  return readAll().slice().sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function isLocalBookmarked(contentType: string, contentId: string): boolean {
  return getIndex().has(bookmarkLookupKey(contentType, contentId));
}

export function toggleLocalBookmark(input: {
  contentType: string;
  contentId: string;
  title?: string;
  href?: string;
}): boolean {
  const key = bookmarkLookupKey(input.contentType, input.contentId);
  const list = readAll().slice();
  const idx = list.findIndex(
    (b) => bookmarkLookupKey(b.contentType, b.contentId) === key,
  );
  if (idx >= 0) {
    const removed = list[idx]!;
    list.splice(idx, 1);
    writeAll(list);
    // Outbox delete with idempotency — deferred so INP stays under 16ms
    void scheduleInputAck(() => {
      enqueueOutbox("bookmark_delete", {
        contentType: removed.contentType,
        contentId: removed.contentId,
        id: removed.id,
      });
    });
    return false;
  }
  const href =
    input.href ||
    (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/");
  const entry: LocalBookmark = {
    id: `lb-${input.contentType}-${input.contentId}-${Date.now()}`,
    contentType: input.contentType,
    contentId: input.contentId,
    title: (input.title || "").trim() || `${input.contentType}/${input.contentId}`,
    href,
    savedAt: new Date().toISOString(),
  };
  list.unshift(entry);
  writeAll(list);
  void scheduleInputAck(() => {
    enqueueOutbox("bookmark_upsert", { ...entry });
  });
  return true;
}

export function removeLocalBookmark(contentType: string, contentId: string): void {
  writeAll(readAll().filter((b) => !(b.contentType === contentType && b.contentId === contentId)));
  void scheduleInputAck(() => {
    enqueueOutbox("bookmark_delete", { contentType, contentId });
  });
}

export function clearLocalBookmarks(): void {
  if (typeof window === "undefined") return;
  writeAll([]);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
