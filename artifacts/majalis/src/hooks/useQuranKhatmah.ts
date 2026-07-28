import { useCallback, useEffect, useState } from "react";
import {
  loadKhatmahGoal,
  saveKhatmahGoal,
  setKhatmahPagesPerDay,
  setKhatmahTargetDate,
  recordKhatmahPages,
  syncKhatmahFromWird,
  predictKhatmahCompletion,
  type KhatmahGoal,
  type KhatmahPrediction,
} from "@/lib/quran-khatmah-tracker";

/** Logic-only hook — no UI. Consumers may ignore unused fields. */
export function useQuranKhatmah(): {
  goal: KhatmahGoal;
  prediction: KhatmahPrediction;
  setPagesPerDay: (n: number) => void;
  setTargetDate: (iso: string | null) => void;
  addPages: (n: number) => void;
  refreshFromWird: () => void;
  replaceGoal: (g: KhatmahGoal) => void;
} {
  const [goal, setGoal] = useState<KhatmahGoal>(() => loadKhatmahGoal());
  const [prediction, setPrediction] = useState<KhatmahPrediction>(() =>
    predictKhatmahCompletion(goal),
  );

  const refresh = useCallback((g: KhatmahGoal) => {
    setGoal(g);
    setPrediction(predictKhatmahCompletion(g));
  }, []);

  useEffect(() => {
    refresh(syncKhatmahFromWird());
  }, [refresh]);

  return {
    goal,
    prediction,
    setPagesPerDay: (n) => refresh(setKhatmahPagesPerDay(n)),
    setTargetDate: (iso) => refresh(setKhatmahTargetDate(iso)),
    addPages: (n) => refresh(recordKhatmahPages(n)),
    refreshFromWird: () => refresh(syncKhatmahFromWird()),
    replaceGoal: (g) => refresh(saveKhatmahGoal(g)),
  };
}
