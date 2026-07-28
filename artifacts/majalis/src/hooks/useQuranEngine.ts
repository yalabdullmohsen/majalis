/**
 * useQuranEngine — React hook for the Quran Engine core (scaffold).
 *
 * Status: empty template — implement subscription to QuranEngineContext next.
 */
import { useEffect, useState } from "react";
import {
  getQuranEngineContext,
  type ActiveVerse,
  type ReadingProgressInput,
} from "@/core/quran/QuranEngineContext";
import type { KhatmahStore } from "@/core/quran/DatabaseManager";

export type UseQuranEngineResult = {
  hydrating: boolean;
  setPage: (page: number) => void;
  setActiveVerse: (verse: ActiveVerse) => void;
  clearActiveVerse: () => void;
  updateReadingProgress: (progress: ReadingProgressInput) => Promise<KhatmahStore | null>;
  loadLastReadingProgress: () => Promise<KhatmahStore | null>;
};

/** Primary hook template for the planned Quran Engine architecture. */
export function useQuranEngine(): UseQuranEngineResult {
  const engine = getQuranEngineContext();
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await engine.loadLastReadingProgress();
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engine]);

  return {
    hydrating,
    setPage: (page) => engine.setPage(page),
    setActiveVerse: (verse) => engine.setActiveVerse(verse),
    clearActiveVerse: () => engine.clearActiveVerse(),
    updateReadingProgress: (progress) => engine.updateReadingProgress(progress),
    loadLastReadingProgress: () => engine.loadLastReadingProgress(),
  };
}

export default useQuranEngine;
