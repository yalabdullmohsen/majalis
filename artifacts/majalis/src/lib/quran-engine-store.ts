/**
 * مصدر حقيقة واحد لحالة محرك المصحف — مخزن خارجي + اشتراك انتقائي
 * لتقليل إعادة الرسم للمكوّنات خارج الشاشة.
 * لا يعتمد على مكتبات حالة جديدة.
 */
import { useCallback, useRef, useSyncExternalStore } from "react";
import type { QuranReadingLayout, QuranReadingTheme } from "@/hooks/useQuranPreferences";
import type { PlayerState, TeachPhase } from "@/hooks/useAyahPlayer";

export type QuranEngineWarmPhase =
  | "idle"
  | "indexes"
  | "pages"
  | "fonts"
  | "done"
  | "aborted"
  | "error";

export type QuranEngineState = {
  page: number;
  surah: number;
  ayah: number | null;
  verseKey: string | null;
  reciterId: string;
  playerState: PlayerState;
  readingTheme: QuranReadingTheme;
  readingLayout: QuranReadingLayout;
  teachPhase: TeachPhase;
  warmPhase: QuranEngineWarmPhase;
  pagesCached: number;
  fontsCached: number;
};

const DEFAULT_STATE: QuranEngineState = {
  page: 1,
  surah: 1,
  ayah: null,
  verseKey: null,
  reciterId: "alafasy",
  playerState: "idle",
  readingTheme: "standard",
  readingLayout: "madani",
  teachPhase: "idle",
  warmPhase: "idle",
  pagesCached: 0,
  fontsCached: 0,
};

type Listener = () => void;

let state: QuranEngineState = { ...DEFAULT_STATE };
const listeners = new Set<Listener>();

export function getQuranEngineState(): QuranEngineState {
  return state;
}

export function subscribeQuranEngine(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function patchQuranEngineState(partial: Partial<QuranEngineState>): void {
  let changed = false;
  const next: QuranEngineState = { ...state };
  (Object.keys(partial) as (keyof QuranEngineState)[]).forEach((key) => {
    const value = partial[key];
    if (value !== undefined && !Object.is(value, state[key])) {
      (next as Record<string, unknown>)[key] = value;
      changed = true;
    }
  });
  if (!changed) return;
  if (next.surah && next.ayah != null) {
    next.verseKey = `${next.surah}:${next.ayah}`;
  } else if (next.ayah == null) {
    next.verseKey = null;
  }
  state = next;
  listeners.forEach((l) => l());
}

export function resetQuranEngineState(): void {
  state = { ...DEFAULT_STATE };
  listeners.forEach((l) => l());
}

/**
 * اشتراك انتقائي — يُعاد الرسم فقط عند تغيّر ناتج الـselector (Object.is).
 * للمكوّنات خارج الشاشة: اختر حقولًا أولية فقط.
 */
export function useQuranEngineSelector<T>(selector: (s: QuranEngineState) => T): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const cached = useRef<T>(selector(getQuranEngineState()));

  const getSnapshot = useCallback(() => {
    const next = selectorRef.current(getQuranEngineState());
    if (!Object.is(cached.current, next)) cached.current = next;
    return cached.current;
  }, []);

  return useSyncExternalStore(subscribeQuranEngine, getSnapshot, getSnapshot);
}
