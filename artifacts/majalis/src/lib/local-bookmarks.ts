export type BookmarkItem = {
  id: string;
  contentKey: string;
  title: string;
  href: string;
  note: string;
  position?: string;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "majalis-local-bookmarks-v1";

export function readBookmarks(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeBookmarks(items: BookmarkItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("majalis-bookmarks-updated"));
}

export function upsertBookmark(input: {
  contentKey: string;
  title: string;
  href: string;
  note?: string;
  position?: string;
}): BookmarkItem {
  const list = readBookmarks();
  const existing = list.find((b) => b.contentKey === input.contentKey);
  const now = Date.now();
  if (existing) {
    existing.note = input.note ?? existing.note;
    existing.position = input.position ?? existing.position;
    existing.updatedAt = now;
    writeBookmarks(list);
    return existing;
  }
  const item: BookmarkItem = {
    id: `bm-${now}`,
    contentKey: input.contentKey,
    title: input.title,
    href: input.href,
    note: input.note || "",
    position: input.position,
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(item);
  writeBookmarks(list.slice(0, 100));
  return item;
}

export function removeBookmark(contentKey: string) {
  writeBookmarks(readBookmarks().filter((b) => b.contentKey !== contentKey));
}

export function getBookmark(contentKey: string): BookmarkItem | undefined {
  return readBookmarks().find((b) => b.contentKey === contentKey);
}
