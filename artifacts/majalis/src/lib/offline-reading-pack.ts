/**
 * حزم قراءة لاحقة/دون اتصال — نص المحتوى المختار فقط على الجهاز.
 * لا تُخزَّن جلسات أو رموز أو بيانات حساب.
 */

const STORAGE_KEY = "majalis-offline-reading-v1";
const MAX_ITEMS = 40;
const MAX_TEXT_CHARS = 12_000;

export type OfflineReadingItem = {
  id: string;
  title: string;
  href: string;
  contentType?: string;
  contentId?: string;
  text: string;
  savedAt: string;
};

function readAll(): OfflineReadingItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? (raw as OfflineReadingItem[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: OfflineReadingItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function listOfflineReading(): OfflineReadingItem[] {
  return readAll().sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function isSavedOffline(contentType: string | undefined, contentId: string | undefined, href?: string): boolean {
  const list = readAll();
  if (contentType && contentId) {
    return list.some((i) => i.contentType === contentType && i.contentId === contentId);
  }
  if (href) return list.some((i) => i.href === href);
  return false;
}

export function saveOfflineReading(input: {
  title: string;
  text: string;
  href?: string;
  contentType?: string;
  contentId?: string;
}): OfflineReadingItem {
  const href =
    input.href ||
    (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/");
  const text = input.text.trim().slice(0, MAX_TEXT_CHARS);
  const list = readAll().filter((i) => {
    if (input.contentType && input.contentId) {
      return !(i.contentType === input.contentType && i.contentId === input.contentId);
    }
    return i.href !== href || i.title !== input.title;
  });
  const item: OfflineReadingItem = {
    id: `off-${Date.now()}`,
    title: input.title.trim() || "محتوى محفوظ",
    href,
    contentType: input.contentType,
    contentId: input.contentId,
    text,
    savedAt: new Date().toISOString(),
  };
  list.unshift(item);
  writeAll(list);
  return item;
}

export function removeOfflineReading(id: string): void {
  writeAll(readAll().filter((i) => i.id !== id));
}

export function clearOfflineReading(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
