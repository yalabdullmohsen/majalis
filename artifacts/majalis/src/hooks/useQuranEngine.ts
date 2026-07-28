/**
 * واجهة موحّدة لمحرك المصحف — خطافات فوق المخزن الخارجي (بلا JSX).
 */
import { useCallback, useContext, useMemo } from "react";
import {
  getQuranEngineState,
  patchQuranEngineState,
  resetQuranEngineState,
  useQuranEngineSelector,
  type QuranEngineState,
} from "@/lib/quran-engine-store";
import { getSimilarAyahsCached, loadMutashabihatIndexCached } from "@/lib/mutashabihat-idb";
import type { MutashabihMatch } from "@/lib/recitation-ai/mutashabihat";
import { searchQuranTopics, QURAN_TOPICS, type QuranTopicSearchHit } from "@/lib/quran-topics-index";
import type { TeachRepeatConfig } from "@/lib/teach-repeat-controller";
import type { AyahLoopConfig } from "@/lib/ayah-loop-controller";
import {
  QuranEngineContext,
  type QuranEngineApi,
  type QuranEngineBridgeSnapshot,
} from "@/components/quran/quran-engine-context";

export type { QuranEngineApi, QuranEngineBridgeSnapshot };

const FALLBACK_API: QuranEngineApi = {
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
};

export function useQuranEngineApi(): QuranEngineApi {
  const ctx = useContext(QuranEngineContext);
  return ctx ?? FALLBACK_API;
}

/** الخطاف الرئيسي — حقول القراءة/التلاوة النشطة فقط */
export function useQuranEngine() {
  const page = useQuranEngineSelector((s) => s.page);
  const surah = useQuranEngineSelector((s) => s.surah);
  const ayah = useQuranEngineSelector((s) => s.ayah);
  const verseKey = useQuranEngineSelector((s) => s.verseKey);
  const reciterId = useQuranEngineSelector((s) => s.reciterId);
  const playerState = useQuranEngineSelector((s) => s.playerState);
  const readingTheme = useQuranEngineSelector((s) => s.readingTheme);
  const readingLayout = useQuranEngineSelector((s) => s.readingLayout);
  const warmPhase = useQuranEngineSelector((s) => s.warmPhase);
  const pagesCached = useQuranEngineSelector((s) => s.pagesCached);
  const api = useQuranEngineApi();
  return {
    page,
    surah,
    ayah,
    verseKey,
    reciterId,
    playerState,
    readingTheme,
    readingLayout,
    warmPhase,
    pagesCached,
    patch: api.patch,
    syncFromReader: api.syncFromReader,
  };
}

/**
 * تظليل كلمة↔صوت / حالة التلاوة النشطة (واجهة فوق مخزن المحرك).
 * لا يملك عنصر Audio — يقرأ الحالة المشتركة فقط.
 */
export function useTarteelVoice() {
  const verseKey = useQuranEngineSelector((s) => s.verseKey);
  const playerState = useQuranEngineSelector((s) => s.playerState);
  const reciterId = useQuranEngineSelector((s) => s.reciterId);
  const ayah = useQuranEngineSelector((s) => s.ayah);
  const surah = useQuranEngineSelector((s) => s.surah);
  return {
    verseKey,
    surah,
    ayah,
    reciterId,
    playing: playerState === "playing" || playerState === "buffering",
    playerState,
  };
}

/** تكرار الحفظ + الترديد — واجهة تنسيق للحالة المعروضة في المخزن */
export function useAudioRepetition(opts?: {
  loopConfig?: AyahLoopConfig | null;
  teachConfig?: TeachRepeatConfig | null;
}) {
  const teachPhase = useQuranEngineSelector((s) => s.teachPhase);
  return {
    teachPhase,
    loopActive: Boolean(opts?.loopConfig),
    teachActive: Boolean(opts?.teachConfig?.enabled),
    loopConfig: opts?.loopConfig ?? null,
    teachConfig: opts?.teachConfig ?? null,
  };
}

/** متشابهات — تحميل كسول من IDB */
export function useMutashabihat(surah?: number, ayah?: number) {
  const activeSurah = useQuranEngineSelector((s) => s.surah);
  const activeAyah = useQuranEngineSelector((s) => s.ayah);
  const s = surah ?? activeSurah;
  const a = ayah ?? activeAyah ?? 1;

  const ensureIndex = useCallback(() => loadMutashabihatIndexCached(), []);

  return {
    surah: s,
    ayah: a,
    ensureIndex,
    getSimilar: (surahNum: number, ayahNum: number): Promise<MutashabihMatch[]> =>
      getSimilarAyahsCached(surahNum, ayahNum),
  };
}

/** فهرس مواضيعي قرآني — بيانات ثابتة في الحزمة */
export function useThematicQuran() {
  return useMemo(
    () => ({
      topics: QURAN_TOPICS,
      search: (query: string, limit = 12): QuranTopicSearchHit[] =>
        searchQuranTopics(query, limit),
    }),
    [],
  );
}

export { resetQuranEngineState, useQuranEngineSelector };
export type { QuranEngineState };
