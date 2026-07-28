/**
 * موفّر سياق محرك المصحف — يبدأ تدفئة الكاش ويفكك الجلسة عند المغادرة.
 * لا يغيّر أنماط CSS أو هيكل الصفحة.
 */
import { useEffect, useMemo, type ReactNode } from "react";
import {
  getQuranEngineState,
  patchQuranEngineState,
} from "@/lib/quran-engine-store";
import { warmQuranEngineCaches } from "@/lib/quran-engine-warm";
import { teardownQuranEngineSession } from "@/lib/quran-engine-teardown";
import { QuranEngineContext, type QuranEngineApi } from "@/components/quran/quran-engine-context";

export function QuranEngineProvider({
  children,
  focusPage = 1,
  enableFullWarm = true,
}: {
  children: ReactNode;
  focusPage?: number;
  /** تدفئة كل الصفحات 1–604 في الخلفية */
  enableFullWarm?: boolean;
}) {
  const api = useMemo<QuranEngineApi>(
    () => ({
      getState: getQuranEngineState,
      patch: patchQuranEngineState,
      syncFromReader: (snap) => {
        patchQuranEngineState({
          page: snap.page,
          surah: snap.surah,
          ayah: snap.ayah,
          reciterId: snap.reciterId,
          playerState: snap.playerState,
          readingTheme: snap.readingTheme,
          readingLayout: snap.readingLayout,
          teachPhase: snap.teachPhase,
        });
      },
    }),
    [],
  );

  useEffect(() => {
    const ac = new AbortController();
    void warmQuranEngineCaches(ac.signal, {
      focusPage,
      fullPages: enableFullWarm,
    });
    return () => {
      ac.abort();
      teardownQuranEngineSession();
    };
    // تشغيل تدفئة واحدة لكل تركيب لقارئ المصحف
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    patchQuranEngineState({ page: focusPage });
  }, [focusPage]);

  return (
    <QuranEngineContext.Provider value={api}>{children}</QuranEngineContext.Provider>
  );
}

export {
  useQuranEngine,
  useQuranEngineApi,
  useTarteelVoice,
  useAudioRepetition,
  useMutashabihat,
  useThematicQuran,
  useQuranEngineSelector,
  resetQuranEngineState,
} from "@/hooks/useQuranEngine";
