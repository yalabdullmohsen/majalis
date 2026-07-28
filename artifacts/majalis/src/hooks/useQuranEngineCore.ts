/**
 * useQuranEngineCore — React hook for the new Quran Engine core (scaffold).
 *
 * NOTE: `src/hooks/useQuranEngine.ts` already exists for the legacy mushaf shell.
 * This file is the planned hook for `src/core/quran/QuranEngineContext`.
 * Do not overwrite `useQuranEngine.ts` until migration is complete.
 */
import { useEffect, useState } from "react";
import {
  getQuranEngineContext,
  type ActiveVerse,
  type ReadingProgressInput,
} from "@/core/quran/QuranEngineContext";
import type { KhatmahStore } from "@/core/quran/DatabaseManager";

export type UseQuranEngineCoreResult = {
  hydrating: boolean;
  setPage: (page: number) => void;
  setActiveVerse: (verse: ActiveVerse) => void;
  clearActiveVerse: () => void;
  updateReadingProgress: (progress: ReadingProgressInput) => Promise<KhatmahStore | null>;
  loadLastReadingProgress: () => Promise<KhatmahStore | null>;
};

export function useQuranEngineCore(): UseQuranEngineCoreResult {
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
