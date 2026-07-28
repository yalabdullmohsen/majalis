/**
 * Sync Quran audio position → verse highlight persistence + auto-scroll.
 * Pure logic hook — does not alter layout; callers opt-in to scroll.
 * Frame-budget: persist ticks + scroll scheduled via rAF (no layout thrash).
 */
import { useEffect, useRef } from "react";
import {
  saveAudioResumeState,
  loadAudioResumeState,
  scrollActiveAyahIntoView,
  type QuranAudioResumeState,
} from "@/lib/quran-audio-resume";
import { createFrameAlignedTicker, scheduleFrame } from "@/lib/frame-budget";

export type UseQuranAudioSyncOptions = {
  surah: number;
  ayah: number | null;
  /** Current audio element (optional) */
  audio?: HTMLAudioElement | null;
  reciterId?: string;
  /** Persist every N ms while playing */
  persistIntervalMs?: number;
  /** Auto-scroll active ayah into view */
  autoScroll?: boolean;
  scrollContainer?: HTMLElement | null;
};

export function useQuranAudioSync(opts: UseQuranAudioSyncOptions): {
  loadResume: () => QuranAudioResumeState | null;
} {
  const lastAyahRef = useRef<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (opts.ayah == null) return;
    if (opts.autoScroll && opts.ayah !== lastAyahRef.current) {
      const ayah = opts.ayah;
      const container = opts.scrollContainer ?? null;
      // Defer scroll to next frame — separates layout read from paint
      scheduleFrame(() => {
        scrollActiveAyahIntoView(ayah, { container, behavior: "auto" });
      });
    }
    lastAyahRef.current = opts.ayah;
    saveAudioResumeState({
      surah: opts.surah,
      ayah: opts.ayah,
      currentTime: opts.audio?.currentTime ?? 0,
      reciterId: opts.reciterId,
      updatedAt: Date.now(),
    });
  }, [opts.ayah, opts.surah, opts.autoScroll, opts.scrollContainer, opts.reciterId, opts.audio]);

  useEffect(() => {
    const audio = opts.audio;
    if (!audio || opts.ayah == null) return;
    const interval = Math.max(1000, opts.persistIntervalMs ?? 2500);
    const stop = createFrameAlignedTicker(interval, () => {
      const o = optsRef.current;
      const el = o.audio;
      if (!el || el.paused || o.ayah == null) return;
      saveAudioResumeState({
        surah: o.surah,
        ayah: o.ayah,
        currentTime: el.currentTime || 0,
        reciterId: o.reciterId,
        updatedAt: Date.now(),
      });
    });
    return stop;
  }, [opts.audio, opts.ayah, opts.surah, opts.reciterId, opts.persistIntervalMs]);

  return {
    loadResume: () => loadAudioResumeState(),
  };
}
