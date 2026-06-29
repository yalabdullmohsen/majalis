const LAST_PAGE_KEY = "majalis-kuwait-mushaf-last-page-v1";
const BOOKMARKS_KEY = "majalis-kuwait-mushaf-bookmarks-v1";
const PREFS_KEY = "majalis-kuwait-mushaf-prefs-v1";
const HISTORY_KEY = "majalis-kuwait-mushaf-history-v1";
const SEARCH_HISTORY_KEY = "majalis-kuwait-mushaf-search-history-v1";
const PAGE_NOTES_KEY = "majalis-kuwait-mushaf-page-notes-v1";

export type MushafBookmark = {
  id: string;
  page: number;
  label: string;
  surah?: number;
  ayah?: number;
  createdAt: string;
};

export type MushafPrefs = {
  nightMode: boolean;
  zoom: number;
  hideChrome: boolean;
  readingMode: boolean;
  dualPage: boolean;
};

export type MushafHistoryEntry = {
  page: number;
  at: string;
};

const DEFAULT_PREFS: MushafPrefs = {
  nightMode: false,
  zoom: 1,
  hideChrome: false,
  readingMode: false,
  dualPage: false,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function getLastMushafPage(): number | null {
  try {
    const raw = localStorage.getItem(LAST_PAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 && n <= 604 ? n : null;
  } catch {
    return null;
  }
}

export function saveLastMushafPage(page: number): void {
  try {
    localStorage.setItem(LAST_PAGE_KEY, String(page));
    pushReadHistory(page);
  } catch {
    /* ignore */
  }
}

export function getMushafBookmarks(): MushafBookmark[] {
  const parsed = readJson<MushafBookmark[]>(BOOKMARKS_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveMushafBookmarks(bookmarks: MushafBookmark[]): void {
  writeJson(BOOKMARKS_KEY, bookmarks);
}

export function addMushafBookmark(bookmark: Omit<MushafBookmark, "id" | "createdAt">): MushafBookmark[] {
  const entry: MushafBookmark = {
    ...bookmark,
    id: `${bookmark.page}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...getMushafBookmarks()];
  saveMushafBookmarks(next);
  return next;
}

export function removeMushafBookmark(id: string): MushafBookmark[] {
  const next = getMushafBookmarks().filter((b) => b.id !== id);
  saveMushafBookmarks(next);
  return next;
}

export function isPageBookmarked(page: number): boolean {
  return getMushafBookmarks().some((b) => b.page === page);
}

export function getMushafPrefs(): MushafPrefs {
  return { ...DEFAULT_PREFS, ...readJson<Partial<MushafPrefs>>(PREFS_KEY, {}) };
}

export function saveMushafPrefs(prefs: Partial<MushafPrefs>): MushafPrefs {
  const next = { ...getMushafPrefs(), ...prefs };
  writeJson(PREFS_KEY, next);
  return next;
}

export function pushReadHistory(page: number, max = 40): MushafHistoryEntry[] {
  const prev = readJson<MushafHistoryEntry[]>(HISTORY_KEY, []);
  const entry: MushafHistoryEntry = { page, at: new Date().toISOString() };
  const next = [entry, ...prev.filter((h) => h.page !== page)].slice(0, max);
  writeJson(HISTORY_KEY, next);
  return next;
}

export function getReadHistory(): MushafHistoryEntry[] {
  return readJson<MushafHistoryEntry[]>(HISTORY_KEY, []);
}

export function pushSearchHistory(query: string, max = 20): string[] {
  const q = query.trim();
  if (!q) return getSearchHistory();
  const prev = readJson<string[]>(SEARCH_HISTORY_KEY, []);
  const next = [q, ...prev.filter((x) => x !== q)].slice(0, max);
  writeJson(SEARCH_HISTORY_KEY, next);
  return next;
}

export function getSearchHistory(): string[] {
  return readJson<string[]>(SEARCH_HISTORY_KEY, []);
}

export function clearSearchHistory(): void {
  writeJson(SEARCH_HISTORY_KEY, []);
}

export type PageNotesMap = Record<string, string>;

export function getPageNotes(): PageNotesMap {
  return readJson<PageNotesMap>(PAGE_NOTES_KEY, {});
}

export function getPageNote(page: number): string {
  return getPageNotes()[String(page)] ?? "";
}

export function savePageNote(page: number, note: string): PageNotesMap {
  const all = getPageNotes();
  const key = String(page);
  if (!note.trim()) {
    delete all[key];
  } else {
    all[key] = note.trim();
  }
  writeJson(PAGE_NOTES_KEY, all);
  return all;
}
