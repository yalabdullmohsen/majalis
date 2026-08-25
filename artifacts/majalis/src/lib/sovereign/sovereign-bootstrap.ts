/**
 * إقلاع نواة Sovereign — workers، تسخين، حراسة صفر-crash، أداء، UX محيط.
 */
import { warmSovereignWorker } from "@/lib/sovereign/sovereign-worker-hub";
import { startThermalSentinel } from "@/lib/sovereign/thermal-sentinel";
import { runPredictivePrewarm } from "@/lib/sovereign/navigation-prewarm";
import { startPredictivePrewarmEngine } from "@/lib/sovereign/predictive-prewarm-engine";
import { startPrayerGeoSilentWatcher } from "@/lib/sovereign/prayer-geo-silent";
import { installZeroCrashGuards } from "@/lib/sovereign/isolation-guard";
import { startPerformanceSentinel } from "@/lib/sovereign/performance-sentinel";
import { startAmbientUxEngine } from "@/lib/sovereign/ambient-ux-engine";
import { startDeviceHandoffSync } from "@/lib/sovereign/device-handoff-sync";
import { guardWorkerHandler } from "@/lib/sovereign/isolation-guard";

const FLAG = "__majalis_sovereign_booted__";

export function startSovereignCore(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[FLAG]) return;
  w[FLAG] = true;

  installZeroCrashGuards();
  startThermalSentinel();
  startPerformanceSentinel();
  startAmbientUxEngine();
  warmSovereignWorker();
  runPredictivePrewarm();
  startPredictivePrewarmEngine();
  startPrayerGeoSilentWatcher();
  startDeviceHandoffSync();
}

export { guardWorkerHandler };
export { recordNavigationPath, runPredictivePrewarm } from "@/lib/sovereign/navigation-prewarm";
export { runOptimisticAction, OPTIMISTIC_UI_BUDGET_MS } from "@/lib/sovereign/optimistic-engine";
export { plainSearchOffMain, normalizeBatchOffMain } from "@/lib/sovereign/sovereign-worker-hub";
export { getSovereignTier } from "@/lib/sovereign/thermal-sentinel";
export { crossfadeAudio } from "@/lib/sovereign/audio-crossfade";
export { FRAME_BUDGET_MS } from "@/lib/sovereign/frame-budget";
export { orderAudioUrlsByCdnHealth, recordCdnFailure, recordCdnSuccess } from "@/lib/sovereign/cdn-failover-router";
export { getUsageHabitSnapshot, recordReadingActivity } from "@/lib/sovereign/predictive-analytics";
export { runOptimisticWalPersist, mergeLwwById } from "@/lib/sovereign/optimistic-wal";
export { guardAsync, guardSync, installZeroCrashGuards } from "@/lib/sovereign/isolation-guard";
export { getFrameHealthSnapshot } from "@/lib/sovereign/performance-sentinel";
export { bindFluidSwipe, stepSpring } from "@/lib/sovereign/fluid-gesture-engine";
export { computeAmbientUx } from "@/lib/sovereign/ambient-ux-engine";
export { publishDeviceHandoff, subscribeDeviceHandoffApply } from "@/lib/sovereign/device-handoff-sync";
