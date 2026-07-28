/**
 * Atomic Quran / Azkar / Audio state selectors via module stores + useSyncExternalStore.
 * Rapid nested updates (audio seconds, scroll) do not cascade into parent re-renders
 * unless a subscribed selector's value actually changes.
 */

import { useCallback, useRef, useSyncExternalStore } from "react";
import { getSurahMeta, type SurahDetail } from "@/lib/quran-api";
import { ADHKAR_CATEGORIES, type AdhkarItem } from "@/lib/adhkar-seed";
import { usePublishedAdhkarItems } from "@/lib/adhkar-service";
import {
  loadAudioResumeState,
  saveAudioResumeState,
  type QuranAudioResumeState,
} from "@/lib/quran-audio-resume";

// ─── Quran selection store (surah/page — not high-frequency) ───────────────

type QuranUiState = {
  surah: number;
  page: number;
  ayah: number | null;
};

let quranState: QuranUiState = { surah: 1, page: 1, ayah: null };
const quranListeners = new Set<() => void>();

function emitQuran(): void {
  for (const l of quranListeners) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

export function setQuranSelection(partial: Partial<QuranUiState>): void {
  const next = { ...quranState, ...partial };
  if (
    next.surah === quranState.surah &&
    next.page === quranState.page &&
    next.ayah === quranState.ayah
  ) {
    return;
  }
  quranState = next;
  emitQuran();
}

function subscribeQuran(cb: () => void): () => void {
  quranListeners.add(cb);
  return () => {
    quranListeners.delete(cb);
  };
}

/** Composite hook — prefer atomic selectors below for hot paths. */
export function useQuran(): QuranUiState & {
  setSurah: (n: number) => void;
  setPage: (n: number) => void;
  setAyah: (n: number | null) => void;
  surahMeta: ReturnType<typeof getSurahMeta>;
} {
  const state = useSyncExternalStore(subscribeQuran, () => quranState, () => quranState);
  return {
    ...state,
    setSurah: (n) => setQuranSelection({ surah: n }),
    setPage: (n) => setQuranSelection({ page: n }),
    setAyah: (n) => setQuranSelection({ ayah: n }),
    surahMeta: getSurahMeta(state.surah),
  };
}

export function useQuranSurah(): number {
  return useSyncExternalStore(subscribeQuran, () => quranState.surah, () => 1);
}

export function useQuranAyah(): number | null {
  return useSyncExternalStore(subscribeQuran, () => quranState.ayah, () => null);
}

export function useQuranPage(): number {
  return useSyncExternalStore(subscribeQuran, () => quranState.page, () => 1);
}

// ─── Audio clock store (high-frequency) ────────────────────────────────────

type AudioClockState = {
  currentTime: number;
  playing: boolean;
  surah: number;
  ayah: number | null;
  reciterId: string | null;
};

let audioClock: AudioClockState = {
  currentTime: 0,
  playing: false,
  surah: 1,
  ayah: null,
  reciterId: null,
};

/** Quantize time to 250ms buckets so selectors don't thrash every frame. */
let lastEmittedBucket = -1;
const audioListeners = new Set<() => void>();

function emitAudio(): void {
  for (const l of audioListeners) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

export function publishAudioClock(partial: Partial<AudioClockState>): void {
  const next = { ...audioClock, ...partial };
  const bucket = Math.floor((next.currentTime || 0) * 4); // 250ms
  const structural =
    next.playing !== audioClock.playing ||
    next.surah !== audioClock.surah ||
    next.ayah !== audioClock.ayah ||
    next.reciterId !== audioClock.reciterId;
  audioClock = next;
  if (structural || bucket !== lastEmittedBucket) {
    lastEmittedBucket = bucket;
    emitAudio();
  }
  // Persist resume without forcing React updates
  if (next.ayah != null) {
    saveAudioResumeState({
      surah: next.surah,
      ayah: next.ayah,
      currentTime: next.currentTime,
      reciterId: next.reciterId ?? undefined,
      updatedAt: Date.now(),
    });
  }
}

function subscribeAudio(cb: () => void): () => void {
  audioListeners.add(cb);
  return () => {
    audioListeners.delete(cb);
  };
}

/** Full audio clock — only for components that need time display. */
export function useAudio(): AudioClockState & {
  loadResume: () => QuranAudioResumeState | null;
} {
  const state = useSyncExternalStore(subscribeAudio, () => audioClock, () => audioClock);
  return {
    ...state,
    loadResume: () => loadAudioResumeState(),
  };
}

/** Atomic: playing boolean only — ignores second ticks. */
export function useAudioPlaying(): boolean {
  return useSyncExternalStore(subscribeAudio, () => audioClock.playing, () => false);
}

/** Atomic: active ayah only. */
export function useAudioAyah(): number | null {
  return useSyncExternalStore(subscribeAudio, () => audioClock.ayah, () => null);
}

/** Atomic: quantized currentTime (0.25s). */
export function useAudioCurrentTime(): number {
  return useSyncExternalStore(
    subscribeAudio,
    () => Math.floor(audioClock.currentTime * 4) / 4,
    () => 0,
  );
}

/**
 * useAudioClockPublisher — call from player hook to push ticks without
 * forcing the player host to re-render on every timeupdate.
 */
export function useAudioClockPublisher(): (partial: Partial<AudioClockState>) => void {
  const pub = useRef(publishAudioClock);
  return useCallback((partial: Partial<AudioClockState>) => {
    pub.current(partial);
  }, []);
}

// ─── Azkar ─────────────────────────────────────────────────────────────────

export function useAzkar() {
  return usePublishedAdhkarItems();
}

export function useAzkarCategories() {
  return ADHKAR_CATEGORIES;
}

export type { AdhkarItem, SurahDetail };
