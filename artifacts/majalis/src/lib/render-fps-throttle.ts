/**
 * Battery / power-aware render FPS throttle for canvas & waveform loops.
 * Downscales 60→30 (or lower) when battery < 20% or reduced power / power-saver.
 * Logic-only — no UI.
 */

import { getPowerSaverState, shouldThrottleUiRender } from "@/lib/power-saver-engine";

export type RenderFpsPolicy = {
  targetFps: number;
  frameIntervalMs: number;
  reasons: string[];
};

type BatteryManagerLike = {
  level: number;
  charging: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
};

let batteryLevel: number | null = null;
let batteryCharging: boolean | null = null;
let batteryBound = false;

async function bindBattery(): Promise<void> {
  if (batteryBound || typeof navigator === "undefined") return;
  batteryBound = true;
  try {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<BatteryManagerLike>;
    };
    if (!nav.getBattery) return;
    const bat = await nav.getBattery();
    batteryLevel = bat.level;
    batteryCharging = bat.charging;
    bat.addEventListener?.("levelchange", () => {
      batteryLevel = bat.level;
    });
    bat.addEventListener?.("chargingchange", () => {
      batteryCharging = bat.charging;
    });
  } catch {
    /* unsupported */
  }
}

/** Kick battery binding once (non-blocking). */
export function startBatteryFpsMonitor(): void {
  void bindBattery();
}

/**
 * Compute target FPS for non-critical canvas / waveform render loops.
 * Critical audio playback clocks should NOT use this.
 */
export function getRenderFpsPolicy(): RenderFpsPolicy {
  void bindBattery();
  const reasons: string[] = [];
  let targetFps = 60;

  const saver = getPowerSaverState();
  if (saver.throttleBackground) {
    targetFps = Math.min(targetFps, saver.maxUiHz || 30);
    reasons.push(`power-saver:${saver.mode}`);
  }

  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    targetFps = Math.min(targetFps, 5);
    reasons.push("hidden");
  }

  // Battery API: level is 0..1
  if (batteryLevel != null && batteryLevel < 0.2 && batteryCharging !== true) {
    targetFps = Math.min(targetFps, 30);
    reasons.push(`battery:${Math.round(batteryLevel * 100)}%`);
  }

  if (batteryLevel != null && batteryLevel < 0.1 && batteryCharging !== true) {
    targetFps = Math.min(targetFps, 15);
    reasons.push("battery-critical");
  }

  // Reduced motion / data-saver hints
  try {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) {
      targetFps = Math.min(targetFps, 30);
      reasons.push("save-data");
    }
  } catch {
    /* ignore */
  }

  targetFps = Math.max(2, Math.min(60, targetFps));
  return {
    targetFps,
    frameIntervalMs: Math.round(1000 / targetFps),
    reasons,
  };
}

/**
 * rAF wrapper that skips frames to honor target FPS.
 * Returns a cancel function.
 */
export function startThrottledAnimationLoop(
  tick: (now: number) => void,
  opts?: { critical?: boolean },
): () => void {
  if (opts?.critical) {
    let id = 0;
    const loop = (now: number) => {
      tick(now);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }

  startBatteryFpsMonitor();
  let raf = 0;
  let lastDraw = 0;
  let cancelled = false;

  const loop = (now: number) => {
    if (cancelled) return;
    const policy = getRenderFpsPolicy();
    if (now - lastDraw >= policy.frameIntervalMs) {
      if (!shouldThrottleUiRender(now)) {
        lastDraw = now;
        tick(now);
      }
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}

/** Interval ms for waveform level meters under current power policy. */
export function getWaveformSampleIntervalMs(baseMs = 100): number {
  const policy = getRenderFpsPolicy();
  // At 60fps → baseMs; at 30fps → 2×; etc.
  const scale = 60 / policy.targetFps;
  return Math.max(baseMs, Math.round(baseMs * scale));
}

export function resetBatteryFpsForTests(): void {
  batteryLevel = null;
  batteryCharging = null;
  batteryBound = false;
}

/** Test helper — inject battery level 0..1 */
export function setBatteryLevelForTests(level: number | null, charging = false): void {
  batteryLevel = level;
  batteryCharging = charging;
  batteryBound = true;
}
