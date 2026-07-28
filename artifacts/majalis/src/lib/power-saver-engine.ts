/**
 * Power Saver & Resource Throttling Engine for Extended Reading.
 * Throttles non-critical background loops and reduces re-render cadence
 * during prolonged reading/audio while keeping playback + reading timers alive.
 */

export type PowerSaverMode = "off" | "balanced" | "aggressive";

export type PowerSaverState = {
  mode: PowerSaverMode;
  /** True when prolonged reading/audio session is active */
  sessionActive: boolean;
  /** Page currently hidden */
  documentHidden: boolean;
  /** Suggested interval multiplier (>=1 slows loops) */
  intervalMultiplier: number;
  /** Max UI refresh Hz suggestion */
  maxUiHz: number;
  /** Skip non-critical background work */
  throttleBackground: boolean;
  /** Keep audio + reading timers exempt */
  audioExempt: boolean;
  readingTimerExempt: boolean;
  startedAt: number | null;
  updatedAt: string;
};

export type PowerSaverPrefs = {
  enabled: boolean;
  /** Enter power-saver after this many ms of continuous reading */
  engageAfterMs: number;
  preferredMode: PowerSaverMode;
};

const LS_KEY = "majalis-power-saver-v1";
const DEFAULT_PREFS: PowerSaverPrefs = {
  enabled: true,
  engageAfterMs: 5 * 60_000,
  preferredMode: "balanced",
};

type ManagedInterval = {
  id: number;
  callback: () => void;
  baseMs: number;
  critical: boolean;
};

const managed = new Map<number, ManagedInterval>();
let sessionTimer: ReturnType<typeof setTimeout> | null = null;
let visibilityBound = false;
let state: PowerSaverState = {
  mode: "off",
  sessionActive: false,
  documentHidden: typeof document !== "undefined" ? document.visibilityState === "hidden" : false,
  intervalMultiplier: 1,
  maxUiHz: 60,
  throttleBackground: false,
  audioExempt: true,
  readingTimerExempt: true,
  startedAt: null,
  updatedAt: new Date().toISOString(),
};

const listeners = new Set<(s: PowerSaverState) => void>();

function emit(): void {
  state = { ...state, updatedAt: new Date().toISOString() };
  for (const l of listeners) {
    try {
      l(state);
    } catch {
      /* ignore */
    }
  }
  rebalanceManagedIntervals();
}

export function loadPowerSaverPrefs(): PowerSaverPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<PowerSaverPrefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePowerSaverPrefs(prefs: PowerSaverPrefs): PowerSaverPrefs {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
  return prefs;
}

export function getPowerSaverState(): PowerSaverState {
  return state;
}

function applyMode(mode: PowerSaverMode): void {
  state.mode = mode;
  if (mode === "off") {
    state.intervalMultiplier = 1;
    state.maxUiHz = 60;
    state.throttleBackground = false;
  } else if (mode === "balanced") {
    state.intervalMultiplier = state.documentHidden ? 4 : 2;
    state.maxUiHz = state.documentHidden ? 5 : 15;
    state.throttleBackground = true;
  } else {
    state.intervalMultiplier = state.documentHidden ? 8 : 3;
    state.maxUiHz = state.documentHidden ? 2 : 8;
    state.throttleBackground = true;
  }
  emit();
}

function ensureVisibilityBinding(): void {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    state.documentHidden = document.visibilityState === "hidden";
    if (state.sessionActive) {
      applyMode(state.mode === "off" ? loadPowerSaverPrefs().preferredMode : state.mode);
    } else {
      emit();
    }
  });
}

/** Begin prolonged reading / audio session — engages saver after engageAfterMs. */
export function beginPowerSaverSession(opts?: { immediate?: boolean }): PowerSaverState {
  ensureVisibilityBinding();
  const prefs = loadPowerSaverPrefs();
  state.sessionActive = true;
  state.startedAt = Date.now();
  state.audioExempt = true;
  state.readingTimerExempt = true;

  if (sessionTimer) clearTimeout(sessionTimer);
  const engage = () => {
    if (!prefs.enabled) {
      applyMode("off");
      return;
    }
    applyMode(prefs.preferredMode === "off" ? "balanced" : prefs.preferredMode);
  };

  if (opts?.immediate) engage();
  else {
    applyMode("off");
    sessionTimer = setTimeout(engage, prefs.engageAfterMs);
  }
  emit();
  return state;
}

export function endPowerSaverSession(): PowerSaverState {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }
  state.sessionActive = false;
  state.startedAt = null;
  applyMode("off");
  return state;
}

export function setPowerSaverMode(mode: PowerSaverMode): PowerSaverState {
  savePowerSaverPrefs({ ...loadPowerSaverPrefs(), preferredMode: mode });
  if (state.sessionActive || mode === "off") applyMode(mode);
  return state;
}

export function subscribePowerSaver(listener: (s: PowerSaverState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Register an interval that auto-throttles under power-saver.
 * Critical intervals (audio progress, reading timers) are never slowed.
 */
export function setThrottledInterval(
  callback: () => void,
  baseMs: number,
  opts?: { critical?: boolean },
): number {
  const critical = opts?.critical === true;
  const effective = critical ? baseMs : Math.round(baseMs * state.intervalMultiplier);
  const id = window.setInterval(callback, Math.max(250, effective));
  managed.set(id, { id, callback, baseMs, critical });
  return id;
}

export function clearThrottledInterval(id: number): void {
  window.clearInterval(id);
  managed.delete(id);
}

function rebalanceManagedIntervals(): void {
  if (typeof window === "undefined") return;
  for (const entry of [...managed.values()]) {
    window.clearInterval(entry.id);
    managed.delete(entry.id);
    const effective = entry.critical
      ? entry.baseMs
      : Math.round(entry.baseMs * state.intervalMultiplier);
    const newId = window.setInterval(entry.callback, Math.max(250, effective));
    managed.set(newId, { ...entry, id: newId });
  }
}

/**
 * Should a non-critical UI consumer skip this render tick?
 * Based on maxUiHz under power-saver.
 */
let lastUiTick = 0;
export function shouldThrottleUiRender(now = Date.now()): boolean {
  if (!state.throttleBackground) return false;
  const minGap = 1000 / Math.max(1, state.maxUiHz);
  if (now - lastUiTick < minGap) return true;
  lastUiTick = now;
  return false;
}

/** Schedule non-critical work only when idle / not aggressively saving. */
export function scheduleNonCriticalWork(fn: () => void): void {
  if (state.mode === "aggressive" && state.documentHidden) return;
  if (state.throttleBackground && typeof requestIdleCallback === "function") {
    requestIdleCallback(() => fn(), { timeout: state.mode === "balanced" ? 3_000 : 8_000 });
    return;
  }
  setTimeout(fn, state.throttleBackground ? 500 : 0);
}

/** Effective delay for a background poll given current saver state. */
export function scaleIntervalMs(baseMs: number, opts?: { critical?: boolean }): number {
  if (opts?.critical) return baseMs;
  return Math.round(baseMs * state.intervalMultiplier);
}
