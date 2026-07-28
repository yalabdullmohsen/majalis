/**
 * Fine-grained bookmark store + selectors — avoids parent re-render cascades.
 */

import { useCallback, useSyncExternalStore } from "react";
import {
  listLocalBookmarks,
  isLocalBookmarked,
  toggleLocalBookmark,
  removeLocalBookmark,
  type LocalBookmark,
} from "@/lib/local-bookmarks";
import { addSafeWindowListener } from "@/lib/safe-listeners";
import { enqueueMutation } from "@/lib/offline-mutation-queue";
import { isOnline } from "@/lib/offline-db";

type BookmarksSnapshot = {
  items: LocalBookmark[];
  version: number;
};

let snap: BookmarksSnapshot = { items: [], version: 0 };
let hydrated = false;
const listeners = new Set<() => void>();
let bound = false;

function hydrate(): void {
  try {
    snap = { items: listLocalBookmarks(), version: snap.version + 1 };
    hydrated = true;
  } catch {
    snap = { items: [], version: snap.version + 1 };
  }
  emit();
}

function emit(): void {
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

function ensureBound(): void {
  if (bound || typeof window === "undefined") return;
  bound = true;
  hydrate();
  addSafeWindowListener("storage", (ev) => {
    const e = ev as StorageEvent;
    if (e.key && e.key !== "majalis-local-bookmarks-v1") return;
    hydrate();
  });
}

function subscribe(cb: () => void): () => void {
  ensureBound();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnap(): BookmarksSnapshot {
  if (!hydrated && typeof window !== "undefined") hydrate();
  return snap;
}

/** Full list — only re-renders when bookmarks version changes. */
export function useBookmarks(): {
  items: LocalBookmark[];
  toggle: (input: {
    contentType: string;
    contentId: string;
    title?: string;
    href?: string;
  }) => boolean;
  remove: (contentType: string, contentId: string) => void;
  isBookmarked: (contentType: string, contentId: string) => boolean;
  refresh: () => void;
} {
  const { items } = useSyncExternalStore(subscribe, getSnap, () => ({ items: [], version: 0 }));

  const toggle = useCallback(
    (input: { contentType: string; contentId: string; title?: string; href?: string }) => {
      const added = toggleLocalBookmark(input);
      hydrate();
      enqueueMutation("bookmark-sync", { ...input, added, at: Date.now() });
      return added;
    },
    [],
  );

  const remove = useCallback((contentType: string, contentId: string) => {
    removeLocalBookmark(contentType, contentId);
    hydrate();
    enqueueMutation("bookmark-sync", { contentType, contentId, removed: true, at: Date.now() });
  }, []);

  const isBookmarked = useCallback(
    (contentType: string, contentId: string) => isLocalBookmarked(contentType, contentId),
    [],
  );

  return {
    items,
    toggle,
    remove,
    isBookmarked,
    refresh: hydrate,
  };
}

/** Atomic selector: bookmarked? for one key — no list subscription churn. */
export function useIsBookmarked(contentType: string, contentId: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isLocalBookmarked(contentType, contentId),
    () => false,
  );
}

/** Atomic: bookmark count only. */
export function useBookmarkCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => getSnap().items.length,
    () => 0,
  );
}

export function getBookmarksOnline(): boolean {
  return isOnline();
}
