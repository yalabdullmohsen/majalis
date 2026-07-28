/**
 * React facade for SM-2 spaced repetition (Mutoon / Quran memorization).
 * Logic-only — no UI.
 */
import { useCallback, useMemo, useState } from "react";
import {
  applyReviewRating,
  INITIAL_CARD_STATE,
  isDue,
  type CardState,
  type ReviewQuality,
  type ReviewRating,
  type Sm2CardMetrics,
} from "@/lib/spaced-repetition";

export type UseSpacedRepetitionOptions = {
  initial?: CardState | Sm2CardMetrics;
};

export function useSpacedRepetition(opts?: UseSpacedRepetitionOptions) {
  const [metrics, setMetrics] = useState<Sm2CardMetrics>(() => {
    const init = opts?.initial ?? INITIAL_CARD_STATE;
    if ("easeFactor" in init) return init;
    return {
      easeFactor: init.ease_factor,
      interval: init.interval_days,
      repetitions: init.repetitions,
      nextReviewDate: new Date().toISOString(),
    };
  });

  const review = useCallback((rating: ReviewRating | ReviewQuality, from?: Date) => {
    setMetrics((prev) => applyReviewRating(prev, rating, from ?? new Date()));
  }, []);

  const reset = useCallback(() => {
    setMetrics({
      easeFactor: INITIAL_CARD_STATE.ease_factor,
      interval: INITIAL_CARD_STATE.interval_days,
      repetitions: INITIAL_CARD_STATE.repetitions,
      nextReviewDate: new Date().toISOString(),
    });
  }, []);

  const due = useMemo(() => isDue(metrics.nextReviewDate), [metrics.nextReviewDate]);

  return {
    metrics,
    review,
    reset,
    isDue: due,
    rateAgain: () => review("again"),
    rateHard: () => review("hard"),
    rateGood: () => review("good"),
    rateEasy: () => review("easy"),
  };
}
