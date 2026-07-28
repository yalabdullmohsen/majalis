/**
 * Background bootstrap for the 8 logic modules — no UI.
 * Soft-warms run via requestIdleCallback so first paint stays responsive.
 */

import { syncSmartLocalNotifications } from "@/lib/smart-local-notifications";
import { predictKhatmahCompletion, maybeNotifyKhatmahBehind, syncKhatmahFromWird } from "@/lib/quran-khatmah-tracker";
import { buildWeeklyProgressAnalytics } from "@/lib/weekly-progress-analytics";
import { loadAudioResumeState } from "@/lib/quran-audio-resume";
import { runWhenIdle } from "@/lib/idle-defer";
import { ensureHibernationBinding, isTabHibernating } from "@/lib/background-hibernation";

const BOOT_FLAG = "__majalis_platform_logic_booted__";

export async function startPlatformLogicSuite(): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    if (w[BOOT_FLAG]) return;
    w[BOOT_FLAG] = true;

    ensureHibernationBinding();

    // Critical-light: analytics + resume (cheap local reads) — still idle-gated
    runWhenIdle(
      () => {
        try {
          buildWeeklyProgressAnalytics();
        } catch {
          /* ignore */
        }
        try {
          loadAudioResumeState();
          syncKhatmahFromWird();
        } catch {
          /* ignore */
        }
      },
      { timeoutMs: 2_000, requireVisible: true, label: "warm-core" },
    );

    // Soft-warm packs during later idle slots
    runWhenIdle(
      () => {
        if (isTabHibernating()) return;
        void (async () => {
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
            const { ensureMemoryPressureBinding, getMemorySnapshot, relieveMemoryPressure } =
              await import("@/lib/memory-pressure");
            ensureMemoryPressureBinding();
            const snap = getMemorySnapshot();
            if (snap.level !== "ok") void relieveMemoryPressure(snap.level);
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
        })();
      },
      { timeoutMs: 8_000, requireVisible: true, label: "warm-soft" },
    );
  } catch {
    /* never interrupt UX */
  }
}
