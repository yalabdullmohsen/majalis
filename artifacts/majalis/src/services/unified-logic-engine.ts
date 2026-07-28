/**
 * Unified Quranic Logic Engine — production orchestrator (non-visual).
 * Boots Modules 1–5 with silent fallbacks; no UI/CSS coupling.
 */

import {
  getOfflineFirstStatus,
  runSmartEviction,
  syncOfflineDeltas,
} from "@/services/offline-first-service";
import { hydrateAutoScrollFromIdb, loadResumePosition } from "@/services/quran-recitation-suite";
import { loadAudioResumeState } from "@/lib/quran-audio-resume";
import { hydrateWeaknessFromIdb } from "@/services/sm2-learning-tracks";
import {
  redistributeKhatmahQuota,
  syncEngagementNotifications,
  trackLearningDay,
} from "@/services/retention-engagement";
import { getCrossTabId, subscribeCrossTab } from "@/services/cross-tab-sync";
import { detectNetworkBandwidthState, subscribeBandwidthChanges } from "@/services/low-bandwidth-sync";
import { loadPowerSaverPrefs } from "@/services/power-saver-engine";
import { syncKhatmahFromWird, predictKhatmahCompletion } from "@/lib/quran-khatmah-tracker";

export type UnifiedEngineModuleId =
  | "offline_first"
  | "recitation_suite"
  | "sm2_learning"
  | "retention_engagement"
  | "perf_sync";

export type UnifiedEngineStatus = {
  booted: boolean;
  modules: Record<UnifiedEngineModuleId, boolean>;
  offline: ReturnType<typeof getOfflineFirstStatus>;
  bandwidthMode: string;
  tabId: string;
  bootedAt: string | null;
};

const BOOT_FLAG = "__majalis_unified_logic_engine_booted__";

let status: UnifiedEngineStatus = {
  booted: false,
  modules: {
    offline_first: false,
    recitation_suite: false,
    sm2_learning: false,
    retention_engagement: false,
    perf_sync: false,
  },
  offline: { online: true, lastDeltaSyncAt: null, aesAvailable: false },
  bandwidthMode: "full",
  tabId: "unknown",
  bootedAt: null,
};

export function getUnifiedEngineStatus(): UnifiedEngineStatus {
  return status;
}

/**
 * Soft-boot all modules. Safe to call once from App mount.
 * Never throws; never blocks UX.
 */
export async function startUnifiedLogicEngine(): Promise<UnifiedEngineStatus> {
  try {
    const hasStorage = typeof localStorage !== "undefined";
    if (!hasStorage && typeof window === "undefined") return status;

    const root =
      typeof window !== "undefined"
        ? (window as unknown as Record<string, unknown>)
        : (globalThis as unknown as Record<string, unknown>);
    if (root[BOOT_FLAG]) return status;
    root[BOOT_FLAG] = true;

    // Module 1 — Offline-first
    try {
      status.offline = getOfflineFirstStatus();
      void syncOfflineDeltas();
      void runSmartEviction(false);
      status.modules.offline_first = true;
    } catch {
      status.modules.offline_first = false;
    }

    // Module 2 — Recitation suite warm
    try {
      loadAudioResumeState();
      loadResumePosition();
      void hydrateAutoScrollFromIdb();
      status.modules.recitation_suite = true;
    } catch {
      status.modules.recitation_suite = false;
    }

    // Module 3 — SM-2 / weakness
    try {
      void hydrateWeaknessFromIdb();
      status.modules.sm2_learning = true;
    } catch {
      status.modules.sm2_learning = false;
    }

    // Module 4 — Retention / khatmah / streak
    try {
      syncKhatmahFromWird();
      redistributeKhatmahQuota();
      trackLearningDay("other");
      void syncEngagementNotifications();
      predictKhatmahCompletion();
      status.modules.retention_engagement = true;
    } catch {
      status.modules.retention_engagement = false;
    }

    // Module 5 — Cross-tab / bandwidth / power prefs
    try {
      status.tabId = getCrossTabId();
      subscribeCrossTab(() => undefined);
      status.bandwidthMode = detectNetworkBandwidthState().mode;
      subscribeBandwidthChanges((s) => {
        status.bandwidthMode = s.mode;
      });
      loadPowerSaverPrefs();
      status.modules.perf_sync = true;
    } catch {
      status.modules.perf_sync = false;
    }

    status.booted = true;
    status.bootedAt = new Date().toISOString();
    return status;
  } catch {
    return status;
  }
}
