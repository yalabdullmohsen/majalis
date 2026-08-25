/**
 * إقلاع نواة Sovereign — workers، تسخين، حارس حراري.
 */
import { warmSovereignWorker } from "@/lib/sovereign/sovereign-worker-hub";
import { startThermalSentinel } from "@/lib/sovereign/thermal-sentinel";
import { runPredictivePrewarm } from "@/lib/sovereign/navigation-prewarm";

const FLAG = "__majalis_sovereign_booted__";

export function startSovereignCore(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[FLAG]) return;
  w[FLAG] = true;

  startThermalSentinel();
  warmSovereignWorker();
  runPredictivePrewarm();
}

export { recordNavigationPath, runPredictivePrewarm } from "@/lib/sovereign/navigation-prewarm";
export { runOptimisticAction, OPTIMISTIC_UI_BUDGET_MS } from "@/lib/sovereign/optimistic-engine";
export { plainSearchOffMain, normalizeBatchOffMain } from "@/lib/sovereign/sovereign-worker-hub";
export { getSovereignTier } from "@/lib/sovereign/thermal-sentinel";
export { crossfadeAudio } from "@/lib/sovereign/audio-crossfade";
