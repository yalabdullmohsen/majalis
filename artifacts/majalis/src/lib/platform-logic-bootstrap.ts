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

    // Soft-warm: topic index + devotional balance + storage LRU (never block UX)
    try {
      const { listTopicCategories } = await import("@/lib/islamic-topic-index");
      listTopicCategories();
    } catch {
      /* ignore */
    }
    try {
      const { loadDevotionalBalance, generateTimeAwarePrompts } = await import(
        "@/lib/devotional-balance-engine"
      );
      generateTimeAwarePrompts({ state: loadDevotionalBalance() });
    } catch {
      /* ignore */
    }
    try {
      const { maybeAutoEvictStorage } = await import("@/lib/smart-cache-eviction");
      void maybeAutoEvictStorage();
    } catch {
      /* ignore */
    }

    // Part 21: cross-storage drift reconcile (LS ↔ session ↔ memory ↔ IDB)
    try {
      const { runStorageReconcile } = await import("@/lib/storage-reconciler");
      void runStorageReconcile();
    } catch {
      /* ignore */
    }

    // Part 23: start RTT / jitter network scheduler
    try {
      const { startNetworkScheduler } = await import("@/lib/network-scheduler");
      startNetworkScheduler();
    } catch {
      /* ignore */
    }

    // Soft-warm: sacred times, cross-tab channel, auto-scroll pace, power-saver binding
    try {
      const { hydrateAutoScrollFromIdb } = await import("@/lib/adaptive-auto-scroll");
      void hydrateAutoScrollFromIdb();
    } catch {
      /* ignore */
    }
    try {
      const { getCrossTabId, subscribeCrossTab } = await import("@/lib/cross-tab-sync");
      getCrossTabId();
      subscribeCrossTab(() => undefined);
    } catch {
      /* ignore */
    }
    try {
      const { loadPowerSaverPrefs } = await import("@/lib/power-saver-engine");
      loadPowerSaverPrefs();
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
