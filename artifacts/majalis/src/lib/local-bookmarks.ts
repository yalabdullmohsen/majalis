/**
 * مفضّلات محلية للجهاز — بديل آمن دون حساب.
 * لا تُخزَّن بيانات حسّاسة؛ فقط نوع المحتوى والمعرّف والعنوان والمسار.
 */

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

function readAll(): LocalBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? (raw as LocalBookmark[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: LocalBookmark[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* quota / private mode */
  }
}

export function listLocalBookmarks(): LocalBookmark[] {
  return readAll().sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function isLocalBookmarked(contentType: string, contentId: string): boolean {
  return readAll().some((b) => b.contentType === contentType && b.contentId === contentId);
}

export function toggleLocalBookmark(input: {
  contentType: string;
  contentId: string;
  title?: string;
  href?: string;
}): boolean {
  const list = readAll();
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
  localStorage.removeItem(STORAGE_KEY);
}
