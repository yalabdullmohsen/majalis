/**
 * useQuranEngine — access Quran Engine state (Provider or singleton fallback).
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  getQuranEngineContext,
  useQuranEngineContextOptional,
  type ActiveVerse,
  type ReadingProgressInput,
  type QuranEngineReactValue,
  type QuranEngineState,
} from "@/core/quran/QuranEngineContext";
import type { ReadingProgress } from "@/core/quran/DatabaseManager";

function useSingletonEngine(): QuranEngineReactValue {
  const engine = getQuranEngineContext();
  const state = useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getState(),
    () => engine.getState(),
  );
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await Promise.all([
          engine.hydratePreferences(),
          engine.loadLastReadingProgress(),
        ]);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engine]);

  const setPage = useCallback((page: number) => engine.setPage(page), [engine]);
  const setActiveVerse = useCallback(
    (verse: ActiveVerse, opts?: { persist?: boolean }) => engine.setActiveVerse(verse, opts),
    [engine],
  );
  const clearActiveVerse = useCallback(() => engine.clearActiveVerse(), [engine]);
  const selectAyah = useCallback((verse: ActiveVerse | null) => engine.selectAyah(verse), [engine]);
  const toggleTajweed = useCallback(() => engine.toggleTajweed(), [engine]);
  const toggleActionBar = useCallback(() => engine.toggleActionBar(), [engine]);
  const setReciter = useCallback((id: string) => engine.setReciter(id), [engine]);
  const updateReadingProgress = useCallback(
    (p: ReadingProgressInput) => engine.updateReadingProgress(p),
    [engine],
  );
  const loadLastReadingProgress = useCallback(
    () => engine.loadLastReadingProgress(),
    [engine],
  );

  return {
    ...state,
    hydrating,
    setPage,
    setActiveVerse,
    clearActiveVerse,
    selectAyah,
    toggleTajweed,
    toggleActionBar,
    setReciter,
    updateReadingProgress,
    loadLastReadingProgress,
    db: engine.db,
  };
}

export type UseQuranEngineResult = QuranEngineReactValue;

export function useQuranEngine(): UseQuranEngineResult {
  const fromProvider = useQuranEngineContextOptional();
  const fallback = useSingletonEngine();
  return fromProvider ?? fallback;
}

export type { QuranEngineState, ActiveVerse, ReadingProgressInput, ReadingProgress };
export default useQuranEngine;
