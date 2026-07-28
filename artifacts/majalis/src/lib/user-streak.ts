/**
 * Daily streak & progress tracking (logic-only).
 *
 * Rules (production):
 * 1) Same calendar day → maintain streak (optional goal counter bump).
 * 2) Activity on last_activity_date + 1 day → increment streak.
 * 3) Activity after a gap (> 1 day) → reset streak to 1.
 *
 * Optional streak-freeze tokens (default 0) can absorb a single missed day
 * when explicitly granted — disabled by default to match the core rules.
 */

const STORAGE_KEY = "majalis-user-streak-v1";
export const USER_STREAK_EVENT = "majalis-streak-updated";

export type UserStreakActivity =
  | "quran"
  | "lesson"
  | "adhkar"
  | "flashcards"
  | "wird"
  | "tasbih"
  | "goal"
  | "other";

export type UserStreakState = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  /** Sum of completed daily goal marks (not unique days). */
  totalGoalsCompleted: number;
  /** Remaining streak-freeze tokens (default 0 — core rules ignore freeze). */
  freezeTokens: number;
  /** Date a freeze was consumed (YYYY-MM-DD). */
  freezeUsedOn?: string | null;
};

const DEFAULT_STATE: UserStreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  totalGoalsCompleted: 0,
  freezeTokens: 0,
  freezeUsedOn: null,
};

function todayKey(offset = 0): string {
  try {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait",
    }).format(d);
  } catch {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  }
}

function dayDiff(a: string, b: string): number {
  const ms = Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`);
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function readState(): UserStreakState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as UserStreakState) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeState(state: UserStreakState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(USER_STREAK_EVENT, { detail: state }));
}

function shiftDateKey(key: string, deltaDays: number): string {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Recompute current streak against "today".
 * Without activity today and a gap ≥ 2 days → display streak as 0 (broken).
 * Optional freeze (tokens > 0) can bridge a single missed day.
 */
export function reconcileStreak(state: UserStreakState = readState(), today = todayKey()): UserStreakState {
  if (!state.lastActiveDate) return state;
  if (state.lastActiveDate === today) return state;

  const gap = dayDiff(state.lastActiveDate, today);
  if (gap <= 0) return state;
  if (gap === 1) return state; // waiting for today's activity

  const yesterday = shiftDateKey(today, -1);

  if (gap === 2 && state.freezeTokens > 0) {
    return {
      ...state,
      freezeTokens: state.freezeTokens - 1,
      freezeUsedOn: yesterday,
      lastActiveDate: yesterday,
    };
  }

  if (gap >= 2) {
    return { ...state, currentStreak: 0 };
  }
  return state;
}

export function getUserStreak(): UserStreakState {
  const before = readState();
  const reconciled = reconcileStreak(before);
  if (JSON.stringify(reconciled) !== JSON.stringify(before)) {
    writeState(reconciled);
  }
  return reconciled;
}

/**
 * Record meaningful user activity for today.
 * @param completedGoal when true, increments totalGoalsCompleted.
 */
export function recordUserActivity(
  _activity: UserStreakActivity = "other",
  options?: { completedGoal?: boolean },
): UserStreakState {
  let state = reconcileStreak(readState());
  const today = todayKey();

  // Same day → maintain
  if (state.lastActiveDate === today) {
    if (options?.completedGoal) {
      state = { ...state, totalGoalsCompleted: state.totalGoalsCompleted + 1 };
      writeState(state);
    }
    return state;
  }

  const yesterday = todayKey(1);
  let nextStreak = 1; // gap > 1 day (or first activity) → reset/start at 1

  if (state.lastActiveDate === yesterday) {
    // Consecutive day → increment
    nextStreak = Math.max(1, state.currentStreak) + 1;
  } else if (
    state.lastActiveDate &&
    dayDiff(state.lastActiveDate, today) === 2 &&
    state.freezeTokens > 0
  ) {
    nextStreak = Math.max(1, state.currentStreak) + 1;
    state = {
      ...state,
      freezeTokens: state.freezeTokens - 1,
      freezeUsedOn: yesterday,
    };
  }

  state = {
    ...state,
    currentStreak: nextStreak,
    longestStreak: Math.max(state.longestStreak, nextStreak),
    lastActiveDate: today,
    totalGoalsCompleted: state.totalGoalsCompleted + (options?.completedGoal ? 1 : 0),
  };
  writeState(state);
  return state;
}

/** Grant an extra freeze token (e.g. reward) — capped at 3. */
export function grantStreakFreeze(count = 1): UserStreakState {
  const state = getUserStreak();
  const next = {
    ...state,
    freezeTokens: Math.min(3, state.freezeTokens + count),
  };
  writeState(next);
  return next;
}

export function getStreakCount(): number {
  return getUserStreak().currentStreak;
}
