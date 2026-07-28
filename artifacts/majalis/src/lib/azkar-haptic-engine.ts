/**
 * Haptic & Smart Azkar Counter Engine — distinct vibrate patterns +
 * localStorage / IndexedDB persistence. Logic-only; does not touch CSS.
 */

import { hapticNotify, hapticTap, isNative } from "@/lib/capacitor-utils";
import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type AzkarHapticPattern = "tap" | "milestone" | "complete" | "undo";

export type SmartAzkarCounterState = {
  id: string;
  title?: string;
  count: number;
  target: number;
  lifetimeTotal: number;
  updatedAt: string;
  /** YYYY-MM-DD → count that day */
  dailyHistory: Record<string, number>;
};

const LS_PREFIX = "majalis-smart-azkar-v1:";
const IDB_PREFIX = "smart-azkar:";

/** Distinct vibration patterns (ms). Web Vibration API; Capacitor uses mapped haptics. */
export const AZKAR_VIBRATE_PATTERNS: Record<AzkarHapticPattern, number | number[]> = {
  tap: 12,
  milestone: [18, 40, 18],
  complete: [30, 50, 30, 50, 60],
  undo: [8, 30, 8],
};

export function todayKey(d = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function fireAzkarHaptic(pattern: AzkarHapticPattern): void {
  try {
    if (isNative) {
      if (pattern === "complete" || pattern === "milestone") {
        void hapticNotify(pattern === "complete" ? "success" : "warning");
      } else if (pattern === "undo") {
        void hapticTap("medium");
      } else {
        void hapticTap("light");
      }
      return;
    }
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    navigator.vibrate(AZKAR_VIBRATE_PATTERNS[pattern]);
  } catch {
    /* unsupported — silent */
  }
}

function lsKey(id: string): string {
  return `${LS_PREFIX}${id}`;
}

function defaultState(id: string, target = 33, title?: string): SmartAzkarCounterState {
  return {
    id,
    title,
    count: 0,
    target: Math.max(1, target),
    lifetimeTotal: 0,
    updatedAt: new Date().toISOString(),
    dailyHistory: {},
  };
}

export function loadSmartAzkarCounter(id: string, target = 33, title?: string): SmartAzkarCounterState {
  try {
    const raw = localStorage.getItem(lsKey(id));
    if (!raw) return defaultState(id, target, title);
    const parsed = JSON.parse(raw) as Partial<SmartAzkarCounterState>;
    return {
      ...defaultState(id, target, title),
      ...parsed,
      id,
      target: Math.max(1, Number(parsed.target) || target),
      count: Math.max(0, Number(parsed.count) || 0),
      lifetimeTotal: Math.max(0, Number(parsed.lifetimeTotal) || 0),
      dailyHistory: parsed.dailyHistory || {},
    };
  } catch {
    return defaultState(id, target, title);
  }
}

export function saveSmartAzkarCounter(state: SmartAzkarCounterState): SmartAzkarCounterState {
  const next = { ...state, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(lsKey(state.id), JSON.stringify(next));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.adhkar, `${IDB_PREFIX}${state.id}`, next).catch(() => undefined);
  return next;
}

export async function loadSmartAzkarCounterAsync(
  id: string,
  target = 33,
  title?: string,
): Promise<SmartAzkarCounterState> {
  try {
    const fromIdb = await idbGetValue<SmartAzkarCounterState>(
      OFFLINE_STORES.adhkar,
      `${IDB_PREFIX}${id}`,
    );
    if (fromIdb?.id) return { ...defaultState(id, target, title), ...fromIdb, id };
  } catch {
    /* fall through */
  }
  return loadSmartAzkarCounter(id, target, title);
}

/**
 * Increment counter; fires tap haptic, milestone every 10 (or target/4),
 * and a distinct complete pattern when crossing the target.
 */
export function incrementSmartAzkar(
  state: SmartAzkarCounterState,
  delta = 1,
): SmartAzkarCounterState {
  const prev = state.count;
  const nextCount = Math.max(0, prev + delta);
  const day = todayKey();
  const dailyHistory = { ...state.dailyHistory };
  dailyHistory[day] = (dailyHistory[day] || 0) + Math.max(0, delta);

  const next: SmartAzkarCounterState = {
    ...state,
    count: nextCount,
    lifetimeTotal: state.lifetimeTotal + Math.max(0, delta),
    dailyHistory,
    updatedAt: new Date().toISOString(),
  };

  if (delta > 0) {
    if (state.target > 0 && prev < state.target && nextCount >= state.target) {
      fireAzkarHaptic("complete");
    } else if (nextCount > 0 && nextCount % 10 === 0) {
      fireAzkarHaptic("milestone");
    } else {
      fireAzkarHaptic("tap");
    }
  } else if (delta < 0) {
    fireAzkarHaptic("undo");
  }

  return saveSmartAzkarCounter(next);
}

export function resetSmartAzkar(state: SmartAzkarCounterState): SmartAzkarCounterState {
  return saveSmartAzkarCounter({ ...state, count: 0 });
}

export function setSmartAzkarTarget(
  state: SmartAzkarCounterState,
  target: number,
): SmartAzkarCounterState {
  return saveSmartAzkarCounter({ ...state, target: Math.max(1, Math.floor(target)) });
}

export function isAzkarTargetReached(state: SmartAzkarCounterState): boolean {
  return state.target > 0 && state.count >= state.target;
}
