import { useCallback, useState } from "react";
import {
  boostMistakesInSm2,
  clearMasteredMistakes,
  getPrioritizedMistakes,
  listMistakes,
  logMistake,
  logMistakeCorrect,
  type MistakeEntry,
  type MistakePrioritizedItem,
  type MistakeSource,
} from "@/lib/mistake-log-manager";

/** Mistake log + adaptive prioritization — logic only. */
export function useMistakeLog(userId = "local") {
  const [mistakes, setMistakes] = useState<MistakeEntry[]>(() => listMistakes(true));
  const [queue, setQueue] = useState<MistakePrioritizedItem[]>(() => getPrioritizedMistakes());

  const refresh = useCallback(() => {
    setMistakes(listMistakes(true));
    setQueue(getPrioritizedMistakes());
  }, []);

  const recordMiss = useCallback(
    (input: {
      source: MistakeSource;
      itemId: string;
      prompt?: string;
      expectedAnswer?: string;
      userAnswer?: string;
    }) => {
      const entry = logMistake(input);
      refresh();
      return entry;
    },
    [refresh],
  );

  const recordCorrect = useCallback(
    (source: MistakeSource, itemId: string) => {
      const entry = logMistakeCorrect(source, itemId);
      refresh();
      return entry;
    },
    [refresh],
  );

  const boostSm2 = useCallback(async () => {
    const n = await boostMistakesInSm2(userId);
    refresh();
    return n;
  }, [userId, refresh]);

  const clearMastered = useCallback(() => {
    const n = clearMasteredMistakes();
    refresh();
    return n;
  }, [refresh]);

  return { mistakes, queue, recordMiss, recordCorrect, boostSm2, clearMastered, refresh };
}
