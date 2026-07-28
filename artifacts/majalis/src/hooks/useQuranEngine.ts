/**
 * useQuranEngine — React hook for the Quran Engine core.
 */
import { useEffect, useState } from "react";
import {
  getQuranEngineContext,
  type ActiveVerse,
  type ReadingProgressInput,
} from "@/core/quran/QuranEngineContext";
import type { ReadingProgress } from "@/core/quran/DatabaseManager";

export type UseQuranEngineResult = {
  hydrating: boolean;
  setPage: (page: number) => void;
  setActiveVerse: (verse: ActiveVerse, opts?: { persist?: boolean }) => void;
  clearActiveVerse: () => void;
  updateReadingProgress: (progress: ReadingProgressInput) => Promise<ReadingProgress | null>;
  loadLastReadingProgress: () => Promise<ReadingProgress | null>;
};

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
    setActiveVerse: (verse, opts) => engine.setActiveVerse(verse, opts),
    clearActiveVerse: () => engine.clearActiveVerse(),
    updateReadingProgress: (progress) => engine.updateReadingProgress(progress),
    loadLastReadingProgress: () => engine.loadLastReadingProgress(),
  };
}

export default useQuranEngine;
