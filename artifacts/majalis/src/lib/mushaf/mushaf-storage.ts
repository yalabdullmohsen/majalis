const LAST_PAGE_KEY = "majalis-kuwait-mushaf-last-page-v1";
const BOOKMARKS_KEY = "majalis-kuwait-mushaf-bookmarks-v1";
const PREFS_KEY = "majalis-kuwait-mushaf-prefs-v1";

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
};

const DEFAULT_PREFS: MushafPrefs = {
  nightMode: false,
  zoom: 1,
  hideChrome: false,
};

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
  } catch {
    /* ignore */
  }
}

export function getMushafBookmarks(): MushafBookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MushafBookmark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMushafBookmarks(bookmarks: MushafBookmark[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch {
    /* ignore */
  }
}

export function addMushafBookmark(bookmark: Omit<MushafBookmark, "id" | "createdAt">): MushafBookmark[] {
  const entry: MushafBookmark = {
    ...bookmark,
    id: `${bookmark.page}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...getMushafBookmarks().filter((b) => b.page !== bookmark.page || b.label !== bookmark.label)];
  saveMushafBookmarks(next.slice(0, 50));
  return next.slice(0, 50);
}

export function removeMushafBookmark(id: string): MushafBookmark[] {
  const next = getMushafBookmarks().filter((b) => b.id !== id);
  saveMushafBookmarks(next);
  return next;
}

export function getMushafPrefs(): MushafPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveMushafPrefs(prefs: Partial<MushafPrefs>): MushafPrefs {
  const next = { ...getMushafPrefs(), ...prefs };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
