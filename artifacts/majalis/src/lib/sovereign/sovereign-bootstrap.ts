/**
 * إقلاع نواة Sovereign — workers، تسخين، حارس حراري، ذكاء تنبؤي.
 */
import { warmSovereignWorker } from "@/lib/sovereign/sovereign-worker-hub";
import { startThermalSentinel } from "@/lib/sovereign/thermal-sentinel";
import { runPredictivePrewarm } from "@/lib/sovereign/navigation-prewarm";
import { startPredictivePrewarmEngine } from "@/lib/sovereign/predictive-prewarm-engine";
import { startPrayerGeoSilentWatcher } from "@/lib/sovereign/prayer-geo-silent";

const FLAG = "__majalis_sovereign_booted__";

export function startSovereignCore(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[FLAG]) return;
  w[FLAG] = true;

  startThermalSentinel();
  warmSovereignWorker();
  runPredictivePrewarm();
  startPredictivePrewarmEngine();
  startPrayerGeoSilentWatcher();
}

export { recordNavigationPath, runPredictivePrewarm } from "@/lib/sovereign/navigation-prewarm";
export { runOptimisticAction, OPTIMISTIC_UI_BUDGET_MS } from "@/lib/sovereign/optimistic-engine";
export { plainSearchOffMain, normalizeBatchOffMain } from "@/lib/sovereign/sovereign-worker-hub";
export { getSovereignTier } from "@/lib/sovereign/thermal-sentinel";
export { crossfadeAudio } from "@/lib/sovereign/audio-crossfade";
export { FRAME_BUDGET_MS } from "@/lib/sovereign/frame-budget";
export { orderAudioUrlsByCdnHealth, recordCdnFailure, recordCdnSuccess } from "@/lib/sovereign/cdn-failover-router";
export { getUsageHabitSnapshot, recordReadingActivity } from "@/lib/sovereign/predictive-analytics";
export { runOptimisticWalPersist, mergeLwwById } from "@/lib/sovereign/optimistic-wal";
