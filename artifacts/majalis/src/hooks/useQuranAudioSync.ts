/**
 * Sync Quran audio position → verse highlight persistence + auto-scroll.
 * Pure logic hook — does not alter layout; callers opt-in to scroll.
 */
import { useEffect, useRef } from "react";
import {
  saveAudioResumeState,
  loadAudioResumeState,
  scrollActiveAyahIntoView,
  type QuranAudioResumeState,
} from "@/lib/quran-audio-resume";

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

  useEffect(() => {
    if (opts.ayah == null) return;
    if (opts.autoScroll && opts.ayah !== lastAyahRef.current) {
      scrollActiveAyahIntoView(opts.ayah, { container: opts.scrollContainer ?? null });
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
    const id = window.setInterval(() => {
      if (audio.paused) return;
      saveAudioResumeState({
        surah: opts.surah,
        ayah: opts.ayah!,
        currentTime: audio.currentTime || 0,
        reciterId: opts.reciterId,
        updatedAt: Date.now(),
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [opts.audio, opts.ayah, opts.surah, opts.reciterId, opts.persistIntervalMs]);

  return {
    loadResume: () => loadAudioResumeState(),
  };
}
