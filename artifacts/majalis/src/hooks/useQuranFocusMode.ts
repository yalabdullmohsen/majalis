import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearFocusMode,
  enableFocusOnAyah,
  loadFocusModeState,
  resolveAyahFocusRole,
  saveFocusModeState,
  setFocusNearRadius,
  type QuranFocusAyahPresentation,
  type QuranFocusState,
} from "@/lib/quran-focus-mode";
import {
  detectMutashabihatCuratedOnly,
  detectMutashabihatForAyah,
  type MutashabihatDetectionResult,
} from "@/lib/mutashabihat-detector";

/**
 * Focus mode + mutashabihat for the active ayah — logic only.
 */
export function useQuranFocusMode(initialSurah?: number, initialAyah?: number) {
  const [state, setState] = useState<QuranFocusState>(() => loadFocusModeState());
  const [mutashabihat, setMutashabihat] = useState<MutashabihatDetectionResult | null>(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    if (initialSurah && initialAyah) {
      setState(enableFocusOnAyah(initialSurah, initialAyah, loadFocusModeState().nearRadius));
    }
  }, [initialSurah, initialAyah]);

  const focusOn = useCallback((surah: number, ayah: number, nearRadius?: number) => {
    const next = enableFocusOnAyah(surah, ayah, nearRadius ?? state.nearRadius);
    setState(next);
  }, [state.nearRadius]);

  const clear = useCallback(() => {
    setState(clearFocusMode());
    setMutashabihat(null);
  }, []);

  const setNearRadius = useCallback((radius: number) => {
    setState(setFocusNearRadius(radius));
  }, []);

  const toggleEnabled = useCallback((enabled: boolean) => {
    const next = { ...state, enabled };
    saveFocusModeState(next);
    setState(next);
  }, [state]);

  const roleFor = useCallback(
    (surah: number, ayah: number): QuranFocusAyahPresentation =>
      resolveAyahFocusRole(surah, ayah, state),
    [state],
  );

  const refreshMutashabihat = useCallback(async () => {
    if (!state.focus) {
      setMutashabihat(null);
      return;
    }
    setLoadingSimilar(true);
    // Instant curated list, then enrich with computed index
    setMutashabihat(
      detectMutashabihatCuratedOnly(state.focus.surah, state.focus.ayah),
    );
    try {
      const full = await detectMutashabihatForAyah(state.focus.surah, state.focus.ayah);
      setMutashabihat(full);
    } catch {
      /* keep curated */
    } finally {
      setLoadingSimilar(false);
    }
  }, [state.focus]);

  useEffect(() => {
    if (state.enabled && state.focus) {
      void refreshMutashabihat();
    }
  }, [state.enabled, state.focus?.surah, state.focus?.ayah, refreshMutashabihat]);

  const similarCount = useMemo(() => mutashabihat?.items.length ?? 0, [mutashabihat]);

  return {
    state,
    focusOn,
    clear,
    setNearRadius,
    toggleEnabled,
    roleFor,
    mutashabihat,
    loadingSimilar,
    refreshMutashabihat,
    similarCount,
  };
}
