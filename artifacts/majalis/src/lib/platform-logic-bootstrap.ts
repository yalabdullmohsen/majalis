/**
 * Background bootstrap for the logic modules — deferred until after first paint.
 * Safe to call once on app mount; all failures are silent.
 */

import { scheduleIdle, afterFirstPaint } from "@/lib/idle-defer";

const BOOT_FLAG = "__majalis_platform_logic_booted__";

export async function startPlatformLogicSuite(): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    if (w[BOOT_FLAG]) return;
    w[BOOT_FLAG] = true;

    // Defer ALL IndexedDB / storage hydrations until after paint + idle
    afterFirstPaint(() => {
      scheduleIdle(() => {
        void runDeferredWarm();
      }, { timeoutMs: 5_000 });
    });
  } catch {
    /* never interrupt UX */
  }
}

async function runDeferredWarm(): Promise<void> {
  try {
    const { buildWeeklyProgressAnalytics } = await import("@/lib/weekly-progress-analytics");
    try {
      buildWeeklyProgressAnalytics();
    } catch {
      /* ignore */
    }

    try {
      const { loadAudioResumeState } = await import("@/lib/quran-audio-resume");
      const { syncKhatmahFromWird, predictKhatmahCompletion, maybeNotifyKhatmahBehind } = await import(
        "@/lib/quran-khatmah-tracker"
      );
      loadAudioResumeState();
      syncKhatmahFromWird();

      const { syncSmartLocalNotifications } = await import("@/lib/smart-local-notifications");
      const prediction = predictKhatmahCompletion();
      await syncSmartLocalNotifications({ khatmahBehind: prediction.behindSchedule });
      maybeNotifyKhatmahBehind(prediction);
    } catch {
      /* ignore */
    }

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

    try {
      const { hydrateAutoScrollFromIdb } = await import("@/lib/adaptive-auto-scroll");
      void hydrateAutoScrollFromIdb();
    } catch {
      /* ignore */
    }
    try {
      // Warm tab id only — no immortal empty BroadcastChannel subscriber
      const { getCrossTabId } = await import("@/lib/cross-tab-sync");
      getCrossTabId();
    } catch {
      /* ignore */
    }
    try {
      const { loadPowerSaverPrefs } = await import("@/lib/power-saver-engine");
      loadPowerSaverPrefs();
    } catch {
      /* ignore */
    }
  } catch {
    /* never interrupt UX */
  }
}
