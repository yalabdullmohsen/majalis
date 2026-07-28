/**
 * Per-ayah audio player using everyayah.com.
 * Auto-advances to next ayah when current ends.
 * Reports currently-playing ayah number for visual highlight.
 * Additive: optional range loop + repeat count + silent delay (memorization).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getAyahAudioUrl, loadReciterId, saveReciterId, loadPlaybackRate, savePlaybackRate } from "@/lib/quran-audio";
import { getSurahMeta } from "@/lib/quran-api";
import { useMediaSession } from "@/hooks/useMediaSession";
import {
  advanceAfterAyahEnded,
  createLoopRuntime,
  normalizeLoopConfig,
  type AyahLoopConfig,
  type AyahLoopRuntime,
} from "@/lib/ayah-loop-controller";
import { saveAudioResumeState } from "@/lib/quran-audio-resume";

export type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";

export function useAyahPlayer(surahNum: number, totalAyahs: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseCleanupRef = useRef<(() => void) | null>(null);
  const delayTimerRef = useRef<number | null>(null);
  const [reciterId, setReciterIdState] = useState<string>(loadReciterId);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [playbackRate, setPlaybackRateState] = useState<number>(loadPlaybackRate);
  /** تكرار الآية الحالية عوضًا عن الانتقال للتالية عند الانتهاء — للحفظ. */
  const [repeatOn, setRepeatOnState] = useState(false);
  const repeatOnRef = useRef(repeatOn);
  const playbackRateRef = useRef(playbackRate);
  const loopRuntimeRef = useRef<AyahLoopRuntime | null>(null);
  const [loopConfig, setLoopConfigState] = useState<AyahLoopConfig | null>(null);
  const loadAndPlayRef = useRef<(surah: number, ayah: number, reciter: string) => void>(() => undefined);

  const clearDelayTimer = useCallback(() => {
    if (delayTimerRef.current != null) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  const setReciterId = useCallback((id: string) => {
    setReciterIdState(id);
    saveReciterId(id);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = rate;
    setPlaybackRateState(rate);
    savePlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, []);

  const setRepeatOn = useCallback((on: boolean) => {
    repeatOnRef.current = on;
    setRepeatOnState(on);
    if (on) {
      loopRuntimeRef.current = null;
      setLoopConfigState(null);
    }
  }, []);

  /** Configure a memorization loop (range + N reps + silent delay). Disables simple repeatOn. */
  const setLoopConfig = useCallback(
    (cfg: Partial<AyahLoopConfig> & { startAyah: number } | null) => {
      clearDelayTimer();
      if (!cfg) {
        loopRuntimeRef.current = null;
        setLoopConfigState(null);
        return;
      }
      const normalized = normalizeLoopConfig(cfg, totalAyahs);
      loopRuntimeRef.current = createLoopRuntime(normalized);
      setLoopConfigState(normalized);
      repeatOnRef.current = false;
      setRepeatOnState(false);
    },
    [totalAyahs, clearDelayTimer],
  );

  // create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.playbackRate = playbackRateRef.current;
    audioRef.current = audio;
    return () => {
      clearDelayTimer();
      pauseCleanupRef.current?.();
      pauseCleanupRef.current = null;
      try {
        if (!audio.paused && Number.isFinite(audio.currentTime)) {
          // Best-effort final marker before teardown (surah/ayah from last play)
          const src = audio.currentSrc || audio.src;
          if (src) {
            /* resume already persisted via saveAudioResumeState on pause/play */
          }
        }
        audio.pause();
        audio.removeAttribute("src");
        audio.src = "";
        audio.load();
      } catch {
        try {
          audio.pause();
        } catch {
          /* ignore */
        }
      }
      audioRef.current = null;
    };
  }, [clearDelayTimer]);

  const loadAndPlay = useCallback((surah: number, ayah: number, reciter: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    clearDelayTimer();
    // Remove previous pause listener before adding a new one
    pauseCleanupRef.current?.();
    pauseCleanupRef.current = null;

    audio.pause();
    audio.src = getAyahAudioUrl(surah, ayah, reciter);
    audio.playbackRate = playbackRateRef.current;
    setCurrentAyah(ayah);
    setPlayerState("loading");
    saveAudioResumeState({
      surah,
      ayah,
      currentTime: 0,
      reciterId: reciter,
      updatedAt: Date.now(),
    });

    const onPlaying = () => setPlayerState("playing");
    const onPause = () => {
      if (audio.ended) return;
      setPlayerState("paused");
      saveAudioResumeState({
        surah,
        ayah,
        currentTime: audio.currentTime || 0,
        reciterId: reciter,
        updatedAt: Date.now(),
      });
    };
    const onEnded = () => {
      pauseCleanupRef.current?.();
      pauseCleanupRef.current = null;

      const loopRt = loopRuntimeRef.current;
      if (loopRt?.active) {
        const { runtime, next } = advanceAfterAyahEnded(loopRt, ayah);
        loopRuntimeRef.current = runtime;
        if (next.action === "play") {
          const playNext = () => loadAndPlayRef.current(surah, next.ayah, reciter);
          if (next.delayMs > 0) {
            setPlayerState("paused");
            delayTimerRef.current = window.setTimeout(playNext, next.delayMs);
          } else {
            playNext();
          }
          return;
        }
        setCurrentAyah(null);
        setPlayerState("idle");
        return;
      }

      if (repeatOnRef.current) {
        loadAndPlayRef.current(surah, ayah, reciter);
      } else if (ayah < totalAyahs) {
        loadAndPlayRef.current(surah, ayah + 1, reciter);
      } else {
        setCurrentAyah(null);
        setPlayerState("idle");
      }
    };
    const onError = () => setPlayerState("error");

    audio.addEventListener("playing", onPlaying, { once: true });
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded, { once: true });
    audio.addEventListener("error", onError, { once: true });

    pauseCleanupRef.current = () => audio.removeEventListener("pause", onPause);

    audio.load();
    /* استدعاء play() فورًا ومتزامنًا مع نفس استدعاء لمسة المستخدم — لا ننتظر
       حدث canplay غير المتزامن. iOS Safari/WebKit (Capacitor WebView أيضًا)
       يُسقِط صلاحية user-gesture لتشغيل صوت إن استُدعيت play() بعد أي جولة
       event-loop لاحقة للمسة الأصلية، فيرفض التشغيل صامتًا (NotAllowedError)
       — هذا هو السبب الجذري الفعلي لعطل التشغيل على iOS تحديدًا (مؤكَّد
       2026-07-22). المتصفح يدير الانتظار الداخلي لتوفر البيانات بنفسه طالما
       استُدعيت play() بالتوقيت الصحيح؛ لا حاجة لانتظار canplay يدويًا. */
    audio.play().catch(() => setPlayerState("error"));
  }, [totalAyahs, clearDelayTimer]);

  loadAndPlayRef.current = loadAndPlay;

  const playFromAyah = useCallback((ayah: number) => {
    loadAndPlay(surahNum, ayah, reciterId);
  }, [surahNum, reciterId, loadAndPlay]);

  const pause = useCallback(() => {
    clearDelayTimer();
    audioRef.current?.pause();
  }, [clearDelayTimer]);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => setPlayerState("error"));
  }, []);

  const stop = useCallback(() => {
    clearDelayTimer();
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    setCurrentAyah(null);
    setPlayerState("idle");
  }, [clearDelayTimer]);

  const togglePlayAyah = useCallback((ayah: number) => {
    if (currentAyah === ayah && playerState === "playing") {
      pause();
    } else if (currentAyah === ayah && playerState === "paused") {
      resume();
    } else {
      playFromAyah(ayah);
    }
  }, [currentAyah, playerState, pause, resume, playFromAyah]);

  // stop when surah changes
  useEffect(() => {
    stop();
    loopRuntimeRef.current = null;
    setLoopConfigState(null);
  }, [surahNum, stop]);

  useMediaSession(
    currentAyah
      ? {
          title: `سورة ${getSurahMeta(surahNum).name} — آية ${currentAyah}`,
          artist: "تلاوة القرآن الكريم — المجلس العلمي",
          playing: playerState === "playing",
          onPlay: resume,
          onPause: pause,
          onStop: stop,
          onNext: currentAyah < totalAyahs ? () => playFromAyah(currentAyah + 1) : undefined,
          onPrevious: currentAyah > 1 ? () => playFromAyah(currentAyah - 1) : undefined,
        }
      : null,
  );

  return {
    currentAyah,
    playerState,
    reciterId,
    setReciterId,
    playbackRate,
    setPlaybackRate,
    repeatOn,
    setRepeatOn,
    /** Memorization loop config (null = disabled). Additive — existing UI ignores it. */
    loopConfig,
    setLoopConfig,
    playFromAyah,
    togglePlayAyah,
    pause,
    resume,
    stop,
    /** Exposed for sync/resume hooks without changing layout */
    audioElement: audioRef,
  };
}
