/**
 * Sync Quran audio position → verse highlight persistence + auto-scroll.
 * Part 12: rAF-interpolated media time for precise resume stamps (not coarse timeupdate).
 * Pure logic hook — does not alter layout; callers opt-in to scroll.
 */
import { useEffect, useRef, type RefObject } from "react";
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
import { attachAudioRafClock } from "@/lib/audio-raf-clock";
import { wallNowMs } from "@/lib/monotonic-time";

export type UseQuranAudioSyncOptions = {
  surah: number;
  ayah: number | null;
  /** Current audio element (optional) */
  audio?: HTMLAudioElement | null;
  /** Prefer ref so mount-time Audio() is observed without forcing re-renders */
  audioRef?: RefObject<HTMLAudioElement | null>;
  reciterId?: string;
  /** Persist every N ms while playing */
  persistIntervalMs?: number;
  /** Auto-scroll active ayah into view */
  autoScroll?: boolean;
  scrollContainer?: HTMLElement | null;
};

function resolveAudio(opts: UseQuranAudioSyncOptions): HTMLAudioElement | null {
  return opts.audioRef?.current ?? opts.audio ?? null;
}

export function useQuranAudioSync(opts: UseQuranAudioSyncOptions): {
  loadResume: () => QuranAudioResumeState | null;
} {
  const lastAyahRef = useRef<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const lastPersistPerf = useRef(0);
  const preciseRef = useRef(0);

  useEffect(() => {
    if (opts.ayah == null) return;
    if (opts.autoScroll && opts.ayah !== lastAyahRef.current) {
      scrollActiveAyahIntoView(opts.ayah, { container: opts.scrollContainer ?? null });
    }
    lastAyahRef.current = opts.ayah;
    const audio = resolveAudio(opts);
    saveAudioResumeState({
      surah: opts.surah,
      ayah: opts.ayah,
      currentTime: preciseRef.current || audio?.currentTime || 0,
      reciterId: opts.reciterId,
      updatedAt: wallNowMs(),
    });
  }, [opts.ayah, opts.surah, opts.autoScroll, opts.scrollContainer, opts.reciterId, opts.audio, opts.audioRef]);

  useEffect(() => {
    const audio = resolveAudio(opts);
    if (!audio || opts.ayah == null) return;
    const persistEvery = Math.max(800, opts.persistIntervalMs ?? 2500);
    const clock = attachAudioRafClock(audio, {
      minEmitMs: 8,
      onSample: (s) => {
        preciseRef.current = s.mediaTime;
        if (!s.playing) return;
        if (s.performanceStamp - lastPersistPerf.current < persistEvery) return;
        lastPersistPerf.current = s.performanceStamp;
        const o = optsRef.current;
        if (o.ayah == null) return;
        saveAudioResumeState({
          surah: o.surah,
          ayah: o.ayah,
          currentTime: s.mediaTime,
          reciterId: o.reciterId,
          updatedAt: wallNowMs(),
        });
      },
    });
    return () => clock.stop();
  }, [opts.audio, opts.audioRef, opts.ayah, opts.surah, opts.reciterId, opts.persistIntervalMs]);

  useEffect(() => {
    const unreg = registerUnloadPersist("useQuranAudioSync", () => {
      const o = optsRef.current;
      if (o.ayah == null) {
        flushAudioResumeState();
        return null;
      }
      const audio = resolveAudio(o);
      const state = {
        surah: o.surah,
        ayah: o.ayah,
        currentTime: preciseRef.current || (audio?.currentTime ?? 0),
        reciterId: o.reciterId,
        updatedAt: wallNowMs(),
      };
      stageAudioResumeState(state);
      return { [AUDIO_RESUME_LS_KEY]: JSON.stringify(state) };
    });
    return () => {
      flushAudioResumeState();
      unreg();
    };
  }, []);

  return {
    loadResume: () => loadAudioResumeState(),
  };
}
