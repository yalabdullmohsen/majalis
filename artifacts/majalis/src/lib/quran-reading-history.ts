/**
 * Web port of RN AsyncStorage `readingHistory` progress logger.
 * Increments a per-day page-turn counter when the reader changes page.
 */

export const READING_HISTORY_KEY = "readingHistory";

export type ReadingHistory = Record<string, number>;

function todayKey(): string {
  return new Date().toISOString().split("T")[0]!;
}

export function getReadingHistory(): ReadingHistory {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(READING_HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: ReadingHistory = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) out[k] = Math.floor(n);
    }
    return out;
  } catch {
    return {};
  }
}

export function getTodayProgress(): number {
  return getReadingHistory()[todayKey()] ?? 0;
}

/**
 * RN: logProgress — called on page change.
 * Stores `{ [YYYY-MM-DD]: pageTurnCount }` in localStorage.
 */
export async function logProgress(): Promise<number> {
  const today = todayKey();
  try {
    const historyData = getReadingHistory();
    historyData[today] = (historyData[today] || 0) + 1;
    localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(historyData));
    return historyData[today]!;
  } catch (e) {
    console.error("Error logging progress", e);
    return getTodayProgress();
  }
}
