/**
 * Battery / Low-Power detection — throttles non-essential background work.
 * Uses navigator.getBattery() when available; no-ops safely otherwise.
 * Logic-only — no UI.
 */

import {
  getPowerSaverState,
  setPowerSaverMode,
  beginPowerSaverSession,
  type PowerSaverMode,
} from "@/lib/power-saver-engine";

export type BatteryThrottleState = {
  supported: boolean;
  level: number | null;
  charging: boolean | null;
  /** True when discharging and level below threshold (or explicit low-power hint). */
  lowPower: boolean;
  /** Defer non-critical workers / pack sync / polls. */
  deferBackground: boolean;
  updatedAt: number;
};

const LOW_LEVEL = 0.2;
const CRITICAL_LEVEL = 0.12;

let state: BatteryThrottleState = {
  supported: false,
  level: null,
  charging: null,
  lowPower: false,
  deferBackground: false,
  updatedAt: Date.now(),
};

let started = false;
let prevMode: PowerSaverMode | null = null;

type BatteryLike = {
  level: number;
  charging: boolean;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function emit(): void {
  state = { ...state, updatedAt: Date.now() };
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("majalis-battery-throttle", { detail: state }));
    } catch {
      /* ignore */
    }
  }
}

function applyFromBattery(bat: BatteryLike): void {
  const level = Number(bat.level);
  const charging = Boolean(bat.charging);
  const lowPower = !charging && Number.isFinite(level) && level <= LOW_LEVEL;
  const critical = !charging && Number.isFinite(level) && level <= CRITICAL_LEVEL;

  state.supported = true;
  state.level = Number.isFinite(level) ? level : null;
  state.charging = charging;
  state.lowPower = lowPower;
  state.deferBackground = lowPower;

  if (critical || lowPower) {
    const current = getPowerSaverState();
    if (prevMode == null) prevMode = current.mode;
    beginPowerSaverSession({ immediate: true });
    setPowerSaverMode(critical ? "aggressive" : "balanced");
  } else if (charging && prevMode != null) {
    setPowerSaverMode(prevMode === "off" ? "off" : prevMode);
    prevMode = null;
  }
  emit();
}

export function getBatteryThrottleState(): BatteryThrottleState {
  return state;
}

/**
 * Idempotent start of Battery Status API monitoring.
 * Safe on browsers without the API (iOS Safari historically).
 */
export function startBatteryMonitoring(): void {
  if (started || typeof navigator === "undefined") return;
  started = true;

  const getBattery = (
    navigator as Navigator & { getBattery?: () => Promise<BatteryLike> }
  ).getBattery;
  if (typeof getBattery !== "function") {
    state.supported = false;
    emit();
    return;
  }

  void getBattery()
    .then((bat) => {
      applyFromBattery(bat);
      const onChange = () => applyFromBattery(bat);
      bat.addEventListener("levelchange", onChange);
      bat.addEventListener("chargingchange", onChange);
    })
    .catch(() => {
      state.supported = false;
      emit();
    });
}

/** Should non-critical Web Worker / idle tasks be deferred? */
export function shouldDeferBackgroundWork(): boolean {
  return state.deferBackground || getPowerSaverState().throttleBackground;
}

/** Test helper. */
export function resetBatteryThrottleForTests(partial?: Partial<BatteryThrottleState>): void {
  state = {
    supported: false,
    level: null,
    charging: null,
    lowPower: false,
    deferBackground: false,
    updatedAt: Date.now(),
    ...partial,
  };
  started = false;
  prevMode = null;
}
