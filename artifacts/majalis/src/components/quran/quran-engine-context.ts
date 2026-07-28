/**
 * سياق React رفيع لمحرك المصحف — قيمة ثابتة (API) بلا حالة ثقيلة.
 */
import { createContext } from "react";
import type { QuranEngineState } from "@/lib/quran-engine-store";
import type { PlayerState, TeachPhase } from "@/hooks/useAyahPlayer";
import type { QuranReadingLayout, QuranReadingTheme } from "@/hooks/useQuranPreferences";

export type QuranEngineBridgeSnapshot = {
  page: number;
  surah: number;
  ayah: number | null;
  reciterId: string;
  playerState: PlayerState;
  readingTheme: QuranReadingTheme;
  readingLayout: QuranReadingLayout;
  teachPhase: TeachPhase;
};

export type QuranEngineApi = {
  getState: () => QuranEngineState;
  patch: (partial: Partial<QuranEngineState>) => void;
  syncFromReader: (snap: QuranEngineBridgeSnapshot) => void;
};

export const QuranEngineContext = createContext<QuranEngineApi | null>(null);
