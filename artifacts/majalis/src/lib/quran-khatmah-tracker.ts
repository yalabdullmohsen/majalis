/**
 * Dynamic Khatmah Tracker & Completion Predictor (logic-only).
 * Custom goals, ETA from reading velocity, behind-schedule detection.
 */

import { getDailyWirdState, saveDailyWirdState, type DailyWirdState } from "@/lib/quran-api";
import { sendLocalNotification, loadNotifPrefs } from "@/lib/local-notifications";

const STORAGE_KEY = "majalis-khatmah-tracker-v1";
const LAST_BEHIND_KEY = "majalis_khatmah_behind_warn_day";
export const QURAN_TOTAL_PAGES = 604;

export type KhatmahGoal = {
  /** Target pages per day */
  pagesPerDay: number;
  /** Optional target completion date (ISO date YYYY-MM-DD) */
  targetDate?: string | null;
  /** Pages already completed toward this khatmah cycle */
  pagesCompleted: number;
  /** When this goal was started */
  startedAt: string;
  updatedAt: string;
};

export type KhatmahPrediction = {
  pagesRemaining: number;
  averagePagesPerDay: number;
  estimatedDaysRemaining: number | null;
  estimatedCompletionDate: string | null;
  behindSchedule: boolean;
  expectedPagesByToday: number;
  deficitPages: number;
};

function todayKey(d = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

function dayDiff(from: string, to: string): number {
  const ms = Date.parse(`${to}T12:00:00`) - Date.parse(`${from}T12:00:00`);
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
}

function defaultGoal(): KhatmahGoal {
  const today = todayKey();
  let pagesPerDay = 2;
  try {
    pagesPerDay = Math.max(1, getDailyWirdState().pagesPerDay || 2);
  } catch {
    /* ignore */
  }
  return {
    pagesPerDay,
    targetDate: null,
    pagesCompleted: 0,
    startedAt: today,
    updatedAt: today,
  };
}

export function loadKhatmahGoal(): KhatmahGoal {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultGoal();
    const parsed = JSON.parse(raw) as Partial<KhatmahGoal>;
    return {
      ...defaultGoal(),
      ...parsed,
      pagesPerDay: Math.max(1, Math.min(60, Number(parsed.pagesPerDay) || 2)),
      pagesCompleted: Math.max(0, Math.min(QURAN_TOTAL_PAGES, Number(parsed.pagesCompleted) || 0)),
    };
  } catch {
    return defaultGoal();
  }
}

export function saveKhatmahGoal(goal: KhatmahGoal): KhatmahGoal {
  const next: KhatmahGoal = {
    ...goal,
    pagesPerDay: Math.max(1, Math.min(60, goal.pagesPerDay)),
    pagesCompleted: Math.max(0, Math.min(QURAN_TOTAL_PAGES, goal.pagesCompleted)),
    updatedAt: todayKey(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  // Mirror pagesPerDay into daily wird for consistency (no UI change)
  try {
    const wird = getDailyWirdState();
    if (wird.pagesPerDay !== next.pagesPerDay) {
      saveDailyWirdState({ ...wird, pagesPerDay: next.pagesPerDay });
    }
  } catch {
    /* ignore */
  }
  return next;
}

export function setKhatmahPagesPerDay(pages: number): KhatmahGoal {
  const g = loadKhatmahGoal();
  return saveKhatmahGoal({ ...g, pagesPerDay: pages });
}

export function setKhatmahTargetDate(isoDate: string | null): KhatmahGoal {
  const g = loadKhatmahGoal();
  return saveKhatmahGoal({ ...g, targetDate: isoDate });
}

export function recordKhatmahPages(pages: number): KhatmahGoal {
  const g = loadKhatmahGoal();
  const add = Math.max(0, Math.floor(pages));
  return saveKhatmahGoal({
    ...g,
    pagesCompleted: Math.min(QURAN_TOTAL_PAGES, g.pagesCompleted + add),
  });
}

/** Sync completed pages from DailyWird totalPagesEver modulo full khatmas */
export function syncKhatmahFromWird(wird?: DailyWirdState): KhatmahGoal {
  try {
    const w = wird ?? getDailyWirdState();
    const inCycle = w.totalPagesEver % QURAN_TOTAL_PAGES;
    const g = loadKhatmahGoal();
    return saveKhatmahGoal({ ...g, pagesCompleted: inCycle, pagesPerDay: w.pagesPerDay || g.pagesPerDay });
  } catch {
    return loadKhatmahGoal();
  }
}

/**
 * Average velocity from weeklyLogs (last up to 14 days with data), fallback to pagesPerDay.
 */
export function computeReadingVelocity(wird?: DailyWirdState): number {
  try {
    const w = wird ?? getDailyWirdState();
    const logs = Object.values(w.weeklyLogs || {}).filter((n) => Number(n) > 0);
    if (logs.length >= 2) {
      const sum = logs.reduce((a, b) => a + Number(b), 0);
      return Math.max(0.1, sum / logs.length);
    }
    if (logs.length === 1) return Math.max(0.1, Number(logs[0]));
    return Math.max(0.1, w.pagesPerDay || 1);
  } catch {
    return 1;
  }
}

export function predictKhatmahCompletion(
  goal: KhatmahGoal = loadKhatmahGoal(),
  now = new Date(),
): KhatmahPrediction {
  try {
    const pagesRemaining = Math.max(0, QURAN_TOTAL_PAGES - goal.pagesCompleted);
    const averagePagesPerDay = computeReadingVelocity();
    const estimatedDaysRemaining =
      averagePagesPerDay > 0 ? Math.ceil(pagesRemaining / averagePagesPerDay) : null;
    const today = todayKey(now);
    const estimatedCompletionDate =
      estimatedDaysRemaining != null ? addDays(today, estimatedDaysRemaining) : null;

    const elapsedDays = Math.max(1, dayDiff(goal.startedAt, today) + 1);
    const expectedPagesByToday = Math.min(
      QURAN_TOTAL_PAGES,
      Math.floor(elapsedDays * goal.pagesPerDay),
    );
    const deficitPages = Math.max(0, expectedPagesByToday - goal.pagesCompleted);

    let behindSchedule = deficitPages >= Math.max(1, Math.ceil(goal.pagesPerDay * 0.5));
    if (goal.targetDate) {
      const daysLeft = dayDiff(today, goal.targetDate);
      const needed = daysLeft > 0 ? pagesRemaining / daysLeft : pagesRemaining;
      if (needed > goal.pagesPerDay * 1.15) behindSchedule = true;
    }

    return {
      pagesRemaining,
      averagePagesPerDay,
      estimatedDaysRemaining,
      estimatedCompletionDate,
      behindSchedule,
      expectedPagesByToday,
      deficitPages,
    };
  } catch {
    return {
      pagesRemaining: QURAN_TOTAL_PAGES,
      averagePagesPerDay: 1,
      estimatedDaysRemaining: null,
      estimatedCompletionDate: null,
      behindSchedule: false,
      expectedPagesByToday: 0,
      deficitPages: 0,
    };
  }
}

/** Fire at most one behind-schedule local notification per day */
export function maybeNotifyKhatmahBehind(prediction?: KhatmahPrediction): boolean {
  try {
    const prefs = loadNotifPrefs();
    if (!prefs.enabled) return false;
    const pred = prediction ?? predictKhatmahCompletion();
    if (!pred.behindSchedule) return false;
    const day = todayKey();
    if (localStorage.getItem(LAST_BEHIND_KEY) === day) return false;
    sendLocalNotification("ورد الختمة متأخر", {
      body: `متبقّي ${pred.pagesRemaining} صفحة — العجز اليوم حوالي ${pred.deficitPages} صفحة.`,
      tag: "majalis-khatmah-behind",
    });
    localStorage.setItem(LAST_BEHIND_KEY, day);
    return true;
  } catch {
    return false;
  }
}
