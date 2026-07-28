/**
 * Background bootstrap for the 8 logic modules — no UI.
 * Safe to call once on app mount; all failures are silent.
 */

import { syncSmartLocalNotifications } from "@/lib/smart-local-notifications";
import { predictKhatmahCompletion, maybeNotifyKhatmahBehind, syncKhatmahFromWird } from "@/lib/quran-khatmah-tracker";
import { buildWeeklyProgressAnalytics } from "@/lib/weekly-progress-analytics";
import { loadAudioResumeState } from "@/lib/quran-audio-resume";

const BOOT_FLAG = "__majalis_platform_logic_booted__";

export async function startPlatformLogicSuite(): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    if (w[BOOT_FLAG]) return;
    w[BOOT_FLAG] = true;

    // Warm weekly analytics (side-effect free except local reads)
    try {
      buildWeeklyProgressAnalytics();
    } catch {
      /* ignore */
    }

    // Warm audio resume + khatmah sync
    try {
      loadAudioResumeState();
      syncKhatmahFromWird();
    } catch {
      /* ignore */
    }

    // Soft-warm: unseen discovery + delta sync (never block UX)
    try {
      const { serveLaunchDiscovery } = await import("@/lib/unseen-benefit-discovery");
      serveLaunchDiscovery(1);
    } catch {
      /* ignore */
    }
    try {
      const { runDeltaSync } = await import("@/lib/delta-content-sync");
      void runDeltaSync();
    } catch {
      /* ignore */
    }

    // Soft-warm learning track resume pointers
    try {
      const { loadAllTrackProgressAsync, getResumePointers } = await import(
        "@/lib/learning-track-tracker"
      );
      await loadAllTrackProgressAsync();
      getResumePointers();
    } catch {
      /* ignore */
    }

    const prediction = predictKhatmahCompletion();
    await syncSmartLocalNotifications({ khatmahBehind: prediction.behindSchedule });
    maybeNotifyKhatmahBehind(prediction);
  } catch {
    /* never interrupt UX */
  }
}
