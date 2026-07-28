import { useCallback, useEffect, useState } from "react";
import {
  getUnifiedEngineStatus,
  startUnifiedLogicEngine,
  type UnifiedEngineStatus,
} from "@/services/unified-logic-engine";
import {
  getOfflineFirstStatus,
  inspectOfflineStorage,
  upsertEncryptedNote,
  readNoteBody,
  type OfflineFirstStatus,
} from "@/services/offline-first-service";
import {
  searchQuranSemantic,
  syncVerseHighlightScroll,
  startMultiVerseBlock,
  isVoiceVerificationAvailable,
} from "@/services/quran-recitation-suite";
import {
  buildCardsFromVerse,
  getPriorityRecallItems,
  getPrioritizedDueReviews,
  recordWeaknessSignal,
} from "@/services/sm2-learning-tracks";
import {
  redistributeKhatmahQuota,
  exportUnifiedStateJson,
  importUnifiedStateJson,
  getEngagementStreak,
  createLocalGroupKhatmah,
} from "@/services/retention-engagement";
import {
  detectNetworkBandwidthState,
  subscribeBandwidthChanges,
  type NetworkBandwidthState,
} from "@/services/low-bandwidth-sync";
import {
  beginPowerSaverSession,
  endPowerSaverSession,
  getPowerSaverState,
  subscribePowerSaver,
  type PowerSaverState,
} from "@/services/power-saver-engine";
import {
  publishCrossTabEvent,
  subscribeCrossTab,
  getCrossTabId,
  type CrossTabMessage,
} from "@/services/cross-tab-sync";

export type UseUnifiedLogicEngineResult = {
  status: UnifiedEngineStatus;
  offline: OfflineFirstStatus;
  bandwidth: NetworkBandwidthState;
  power: PowerSaverState;
  tabId: string;
  lastCrossTab: CrossTabMessage | null;
  boot: () => Promise<UnifiedEngineStatus>;
  searchQuran: typeof searchQuranSemantic;
  scrollToAyah: typeof syncVerseHighlightScroll;
  startVerseBlock: typeof startMultiVerseBlock;
  voiceAvailable: boolean;
  recordWeakness: typeof recordWeaknessSignal;
  priorityRecall: ReturnType<typeof getPriorityRecallItems>;
  buildVerseCards: typeof buildCardsFromVerse;
  getDueReviews: typeof getPrioritizedDueReviews;
  adaptKhatmah: typeof redistributeKhatmahQuota;
  exportBackup: typeof exportUnifiedStateJson;
  importBackup: typeof importUnifiedStateJson;
  streak: ReturnType<typeof getEngagementStreak>;
  createGroupKhatmah: typeof createLocalGroupKhatmah;
  encryptNote: typeof upsertEncryptedNote;
  decryptNote: typeof readNoteBody;
  inspectStorage: typeof inspectOfflineStorage;
  beginPowerSaver: typeof beginPowerSaverSession;
  endPowerSaver: typeof endPowerSaverSession;
  publishCrossTab: typeof publishCrossTabEvent;
};

/** Single hook surface for the unified non-visual logic engine. */
export function useUnifiedLogicEngine(opts?: { autoBoot?: boolean }): UseUnifiedLogicEngineResult {
  const [status, setStatus] = useState<UnifiedEngineStatus>(() => getUnifiedEngineStatus());
  const [offline, setOffline] = useState<OfflineFirstStatus>(() => getOfflineFirstStatus());
  const [bandwidth, setBandwidth] = useState<NetworkBandwidthState>(() => detectNetworkBandwidthState());
  const [power, setPower] = useState<PowerSaverState>(() => getPowerSaverState());
  const [lastCrossTab, setLastCrossTab] = useState<CrossTabMessage | null>(null);
  const [priorityRecall, setPriorityRecall] = useState(() => getPriorityRecallItems());

  const boot = useCallback(async () => {
    const next = await startUnifiedLogicEngine();
    setStatus(next);
    setOffline(getOfflineFirstStatus());
    setBandwidth(detectNetworkBandwidthState());
    setPriorityRecall(getPriorityRecallItems());
    return next;
  }, []);

  useEffect(() => {
    if (opts?.autoBoot === false) return;
    void boot();
  }, [opts?.autoBoot, boot]);

  useEffect(() => subscribeBandwidthChanges(setBandwidth), []);
  useEffect(() => subscribePowerSaver(setPower), []);
  useEffect(() => subscribeCrossTab(setLastCrossTab), []);

  return {
    status,
    offline,
    bandwidth,
    power,
    tabId: getCrossTabId(),
    lastCrossTab,
    boot,
    searchQuran: searchQuranSemantic,
    scrollToAyah: syncVerseHighlightScroll,
    startVerseBlock: startMultiVerseBlock,
    voiceAvailable: isVoiceVerificationAvailable(),
    recordWeakness: (s) => {
      const e = recordWeaknessSignal(s);
      setPriorityRecall(getPriorityRecallItems());
      return e;
    },
    priorityRecall,
    buildVerseCards: buildCardsFromVerse,
    getDueReviews: getPrioritizedDueReviews,
    adaptKhatmah: redistributeKhatmahQuota,
    exportBackup: exportUnifiedStateJson,
    importBackup: importUnifiedStateJson,
    streak: getEngagementStreak(),
    createGroupKhatmah: createLocalGroupKhatmah,
    encryptNote: upsertEncryptedNote,
    decryptNote: readNoteBody,
    inspectStorage: inspectOfflineStorage,
    beginPowerSaver: beginPowerSaverSession,
    endPowerSaver: endPowerSaverSession,
    publishCrossTab: publishCrossTabEvent,
  };
}
