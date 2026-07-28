import { useCallback, useEffect, useState } from "react";
import {
  clearWeaknessEntry,
  getPriorityRecallItems,
  loadPriorityRecallList,
  loadPriorityRecallListAsync,
  mergePriorityIntoQueue,
  recordWeaknessSignal,
  syncPriorityRecallToSm2,
  type PriorityRecallList,
  type WeaknessEntry,
  type WeaknessSignal,
} from "@/lib/weakness-recall-engine";

/** Personal weakness tracker & adaptive recall — logic only. */
export function useWeaknessRecall(opts?: { userId?: string }) {
  const [list, setList] = useState<PriorityRecallList>(() => loadPriorityRecallList());
  const [priority, setPriority] = useState<WeaknessEntry[]>(() => getPriorityRecallItems());

  useEffect(() => {
    void loadPriorityRecallListAsync().then((l) => {
      setList(l);
      setPriority(getPriorityRecallItems());
    });
  }, []);

  const record = useCallback((signal: WeaknessSignal) => {
    const entry = recordWeaknessSignal(signal);
    setList(loadPriorityRecallList());
    setPriority(getPriorityRecallItems());
    return entry;
  }, []);

  const clear = useCallback((itemId: string, cardType?: string) => {
    clearWeaknessEntry(itemId, cardType);
    setList(loadPriorityRecallList());
    setPriority(getPriorityRecallItems());
  }, []);

  const prioritizeQueue = useCallback(<T extends { card_id?: string; card_type?: string; key?: string; id?: string }>(
    due: T[],
  ) => mergePriorityIntoQueue(due), []);

  const syncToSm2 = useCallback(async () => {
    const rows = await syncPriorityRecallToSm2({ userId: opts?.userId });
    setList(loadPriorityRecallList());
    setPriority(getPriorityRecallItems());
    return rows;
  }, [opts?.userId]);

  return { list, priority, record, clear, prioritizeQueue, syncToSm2 };
}
