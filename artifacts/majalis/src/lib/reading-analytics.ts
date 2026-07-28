/**
 * Personal Reading Analytics & Heatmap Generator.
 * Records dwell time per Quran page, active hours, completion rates.
 * Aggregates in LS + IndexedDB into weekly/monthly payloads.
 */

import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import { getDailyWirdState } from "@/lib/quran-api";
import { recordDailyReading } from "@/lib/quran-personal";

export type PageHeatCell = {
  page: number; // 1–604
  totalMs: number;
  visits: number;
  lastVisitedAt: number;
};

export type HourBucket = {
  /** 0–23 local hour */
  hour: number;
  totalMs: number;
  sessions: number;
};

export type ReadingAnalyticsStore = {
  pages: Record<string, PageHeatCell>; // key = page number string
  hours: Record<string, HourBucket>; // key = hour string
  /** YYYY-MM-DD → pages completed that day */
  dailyPagesCompleted: Record<string, number>;
  /** YYYY-MM-DD → active reading ms */
  dailyActiveMs: Record<string, number>;
  updatedAt: string;
};

export type ReadingAnalyticsPeriodPayload = {
  period: "week" | "month";
  startDate: string;
  endDate: string;
  generatedAt: string;
  totalActiveMs: number;
  pagesVisited: number;
  pagesCompletedEstimate: number;
  completionRate: number; // 0–1 vs 604 or vs goal
  heatmap: PageHeatCell[];
  activeHours: HourBucket[];
  daily: Array<{ date: string; pages: number; activeMs: number }>;
};

const LS_KEY = "majalis-reading-analytics-v1";
const IDB_KEY = "reading-analytics-store";
const QURAN_PAGES = 604;

function todayKey(d = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function emptyStore(): ReadingAnalyticsStore {
  return {
    pages: {},
    hours: {},
    dailyPagesCompleted: {},
    dailyActiveMs: {},
    updatedAt: new Date().toISOString(),
  };
}

export function loadReadingAnalytics(): ReadingAnalyticsStore {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return emptyStore();
    return { ...emptyStore(), ...(JSON.parse(raw) as Partial<ReadingAnalyticsStore>) };
  } catch {
    return emptyStore();
  }
}

export function saveReadingAnalytics(store: ReadingAnalyticsStore): ReadingAnalyticsStore {
  const next = { ...store, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, next).catch(() => undefined);
  return next;
}

export async function loadReadingAnalyticsAsync(): Promise<ReadingAnalyticsStore> {
  try {
    const fromIdb = await idbGetValue<ReadingAnalyticsStore>(OFFLINE_STORES.meta, IDB_KEY);
    if (fromIdb?.pages) return { ...emptyStore(), ...fromIdb };
  } catch {
    /* fall through */
  }
  return loadReadingAnalytics();
}

const pageTimers = new Map<number, number>();

export function beginPageReading(page: number): void {
  if (page < 1 || page > QURAN_PAGES) return;
  pageTimers.set(page, Date.now());
}

/**
 * End a page dwell session. Optionally mark as completed page turn.
 */
export function endPageReading(
  page: number,
  opts?: { completed?: boolean; minMs?: number },
): PageHeatCell | null {
  const started = pageTimers.get(page);
  pageTimers.delete(page);
  if (!started) return null;
  let durationMs = Date.now() - started;
  if (opts?.completed && durationMs < 1) durationMs = 1;
  if (durationMs < (opts?.minMs ?? 1_500)) return null;

  const store = loadReadingAnalytics();
  const key = String(page);
  const prev = store.pages[key] || {
    page,
    totalMs: 0,
    visits: 0,
    lastVisitedAt: 0,
  };
  const cell: PageHeatCell = {
    page,
    totalMs: prev.totalMs + durationMs,
    visits: prev.visits + 1,
    lastVisitedAt: Date.now(),
  };
  store.pages[key] = cell;

  const hour = new Date().getHours();
  const hKey = String(hour);
  const hPrev = store.hours[hKey] || { hour, totalMs: 0, sessions: 0 };
  store.hours[hKey] = {
    hour,
    totalMs: hPrev.totalMs + durationMs,
    sessions: hPrev.sessions + 1,
  };

  const day = todayKey();
  store.dailyActiveMs[day] = (store.dailyActiveMs[day] || 0) + durationMs;
  if (opts?.completed) {
    store.dailyPagesCompleted[day] = (store.dailyPagesCompleted[day] || 0) + 1;
    try {
      recordDailyReading(0, 1, Math.max(1, Math.round(durationMs / 60_000)));
    } catch {
      /* ignore */
    }
  }

  saveReadingAnalytics(store);
  return cell;
}

function dateRange(period: "week" | "month", now = new Date()): { start: Date; end: Date; keys: string[] } {
  const end = new Date(now);
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  const days = period === "week" ? 7 : 30;
  start.setDate(end.getDate() - (days - 1));
  const keys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    keys.push(todayKey(d));
  }
  return { start, end, keys };
}

/**
 * Build exportable weekly or monthly analytics payload (no manual input).
 */
export function buildReadingAnalyticsPayload(
  period: "week" | "month" = "week",
  now = new Date(),
  store: ReadingAnalyticsStore = loadReadingAnalytics(),
): ReadingAnalyticsPeriodPayload {
  const { start, end, keys } = dateRange(period, now);
  let totalActiveMs = 0;
  const daily = keys.map((date) => {
    const activeMs = store.dailyActiveMs[date] || 0;
    totalActiveMs += activeMs;
    return {
      date,
      pages: store.dailyPagesCompleted[date] || 0,
      activeMs,
    };
  });

  // Also fold wird weekly logs when local page completions sparse
  try {
    const wird = getDailyWirdState();
    for (const row of daily) {
      if (!row.pages && wird.weeklyLogs?.[row.date]) {
        row.pages = Number(wird.weeklyLogs[row.date]) || 0;
      }
    }
  } catch {
    /* ignore */
  }

  const pagesCompletedEstimate = daily.reduce((n, d) => n + d.pages, 0);
  const heatmap = Object.values(store.pages).sort((a, b) => b.totalMs - a.totalMs);
  const activeHours = Object.values(store.hours).sort((a, b) => a.hour - b.hour);
  const pagesVisited = heatmap.filter((c) => c.visits > 0).length;

  return {
    period,
    startDate: todayKey(start),
    endDate: todayKey(end),
    generatedAt: now.toISOString(),
    totalActiveMs,
    pagesVisited,
    pagesCompletedEstimate,
    completionRate: Math.min(1, pagesCompletedEstimate / (period === "week" ? 14 : 60)),
    heatmap,
    activeHours,
    daily,
  };
}

export function exportReadingAnalyticsJson(period: "week" | "month" = "week"): string {
  return JSON.stringify(buildReadingAnalyticsPayload(period), null, 2);
}

/** Intensity 0–1 for heatmap UI consumers (logic hint only). */
export function pageHeatIntensity(
  page: number,
  store: ReadingAnalyticsStore = loadReadingAnalytics(),
): number {
  const cell = store.pages[String(page)];
  if (!cell || cell.totalMs <= 0) return 0;
  const maxMs = Math.max(1, ...Object.values(store.pages).map((c) => c.totalMs));
  return Math.min(1, cell.totalMs / maxMs);
}
