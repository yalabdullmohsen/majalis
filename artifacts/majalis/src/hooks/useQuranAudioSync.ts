/**
 * Sync Quran audio position → verse highlight persistence + auto-scroll.
 * Pure logic hook — does not alter layout; callers opt-in to scroll.
 * Unload-safe: stages currentTime and flushes on pagehide / visibility hidden.
 */
import { useEffect, useRef } from "react";
import {
  saveAudioResumeState,
  stageAudioResumeState,
  flushAudioResumeState,
  loadAudioResumeState,
  scrollActiveAyahIntoView,
  AUDIO_RESUME_LS_KEY,
  type QuranAudioResumeState,
} from "@/lib/quran-audio-resume";
import { registerUnloadPersist } from "@/lib/unload-persist";
import { onLifecycleResume } from "@/lib/page-lifecycle";

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

  // Unload / freeze: capture latest currentTime without waiting for interval
  useEffect(() => {
    const unreg = registerUnloadPersist("useQuranAudioSync", () => {
      const o = optsRef.current;
      if (o.ayah == null) {
        flushAudioResumeState();
        return null;
      }
      const state = {
        surah: o.surah,
        ayah: o.ayah,
        currentTime: o.audio?.currentTime ?? 0,
        reciterId: o.reciterId,
        updatedAt: Date.now(),
      };
      stageAudioResumeState(state);
      return { [AUDIO_RESUME_LS_KEY]: JSON.stringify(state) };
    });
    const unregLife = onLifecycleResume((snap) => {
      const audio = optsRef.current.audio;
      const a = snap?.audio;
      if (!audio || !a) return;
      if (optsRef.current.ayah !== a.ayah || optsRef.current.surah !== a.surah) return;
      try {
        if (Number.isFinite(a.currentTime) && a.currentTime > 0) {
          audio.currentTime = a.currentTime;
        }
      } catch {
        /* ignore */
      }
    });
    return () => {
      flushAudioResumeState();
      unreg();
      unregLife();
    };
  }, []);

  return {
    loadResume: () => loadAudioResumeState(),
  };
}
