import { useCallback, useEffect, useRef, useState } from "react";
import {
  executeAutoScroll,
  hydrateAutoScrollFromIdb,
  loadAutoScrollPrefs,
  loadReadingVelocityProfile,
  planAutoScroll,
  recordVerseDwell,
  saveAutoScrollPrefs,
  scheduleAutoScroll,
  type AutoScrollPrefs,
  type ReadingVelocityProfile,
} from "@/lib/adaptive-auto-scroll";

/** Adaptive auto-scroll & reading pace — logic only. */
export function useAdaptiveAutoScroll(opts?: { container?: HTMLElement | null }) {
  const [prefs, setPrefs] = useState<AutoScrollPrefs>(() => loadAutoScrollPrefs());
  const [profile, setProfile] = useState<ReadingVelocityProfile>(() => loadReadingVelocityProfile());
  const cancelRef = useRef<(() => void) | null>(null);
  const dwellStart = useRef(Date.now());

  useEffect(() => {
    void hydrateAutoScrollFromIdb().then(({ prefs: p, profile: pr }) => {
      setPrefs(p);
      setProfile(pr);
    });
  }, []);

  const scrollToAyah = useCallback(
    (ayah: number, syncWithAudio = false) => {
      cancelRef.current?.();
      cancelRef.current = scheduleAutoScroll({
        ayah,
        syncWithAudio,
        container: opts?.container,
      });
    },
    [opts?.container],
  );

  const onAyahChange = useCallback(
    (ayah: number) => {
      const dwell = Date.now() - dwellStart.current;
      if (dwell > 800) setProfile(recordVerseDwell(dwell));
      dwellStart.current = Date.now();
      if (prefs.followAudio) scrollToAyah(ayah, true);
    },
    [prefs.followAudio, scrollToAyah],
  );

  const updatePrefs = useCallback((patch: Partial<AutoScrollPrefs>) => {
    const next = saveAutoScrollPrefs({ ...loadAutoScrollPrefs(), ...patch });
    setPrefs(next);
    return next;
  }, []);

  useEffect(() => () => cancelRef.current?.(), []);

  return {
    prefs,
    profile,
    scrollToAyah,
    onAyahChange,
    updatePrefs,
    plan: planAutoScroll,
    execute: executeAutoScroll,
  };
}
