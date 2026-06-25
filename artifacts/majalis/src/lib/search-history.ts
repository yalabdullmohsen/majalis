const STORAGE_KEY = "majalis-search-history";
const ANALYTICS_KEY = "majalis-search-analytics";
const MAX_HISTORY = 12;

export type SearchHistoryEntry = {
  query: string;
  at: number;
};

function readHistory(): SearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SearchHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: SearchHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    /* quota */
  }
}

export function getSearchHistory(): string[] {
  return readHistory().map((entry) => entry.query);
}

export function addSearchHistory(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;

  const next = [{ query: trimmed, at: Date.now() }, ...readHistory().filter((e) => e.query !== trimmed)];
  writeHistory(next);

  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    const counts = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    counts[trimmed] = (counts[trimmed] || 0) + 1;
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(Object.fromEntries(sorted)));
  } catch {
    /* optional */
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getTopSearchQueries(limit = 8): { query: string; count: number }[] {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return [];
    const counts = JSON.parse(raw) as Record<string, number>;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  } catch {
    return [];
  }
}
