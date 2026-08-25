/**
 * حارس حراري/بطارية — يخفّض معدل الإطارات وتأثيرات UI الثقيلة تلقائيًا.
 */
import { getRenderFpsPolicy, startBatteryFpsMonitor } from "@/lib/render-fps-throttle";
import { getPowerSaverState, subscribePowerSaver } from "@/lib/power-saver-engine";
import { readMemorySnapshot, subscribeMemoryPressure } from "@/lib/memory-pressure";

export type SovereignTier = "peak" | "balanced" | "conserving" | "critical";

let tier: SovereignTier = "peak";
let started = false;

function applyTier(next: SovereignTier): void {
  if (tier === next) return;
  tier = next;
  if (typeof document === "undefined") return;
  document.documentElement.dataset.sovereignTier = next;
  document.documentElement.dataset.textProfile =
    next === "conserving" || next === "critical" ? "low" : "normal";
}

function computeTier(): SovereignTier {
  const mem = readMemorySnapshot();
  if (mem.level === "critical") return "critical";
  const saver = getPowerSaverState();
  if (saver.mode === "aggressive") return "critical";
  const fps = getRenderFpsPolicy();
  if (mem.level === "moderate" || saver.mode === "balanced" || fps.targetFps <= 30) return "conserving";
  if (fps.targetFps < 60) return "balanced";
  return "peak";
}

export function getSovereignTier(): SovereignTier {
  return tier;
}

export function startThermalSentinel(): void {
  if (started || typeof document === "undefined") return;
  started = true;
  startBatteryFpsMonitor();
  applyTier(computeTier());

  const tick = () => applyTier(computeTier());
  subscribePowerSaver(tick);
  subscribeMemoryPressure(tick);

  if (typeof window !== "undefined") {
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", tick);
  }
}

export function resetThermalSentinelForTests(): void {
  started = false;
  tier = "peak";
}
