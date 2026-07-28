/**
 * Per-ayah audio player using everyayah.com.
 * Auto-advances to next ayah when current ends.
 * Reports currently-playing ayah number for visual highlight.
 * Additive: optional range loop + repeat count + silent delay (memorization).
 * Part 9: stall/network-drop recovery preserves playback position (no UI timeline reset).
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
import {
  attachAudioStallRecovery,
  releaseAudioElement,
  type StallRecoveryHandle,
  type StallRecoveryPhase,
} from "@/lib/audio-stall-recovery";
import { attachAudioRafClock, type AudioRafClockHandle } from "@/lib/audio-raf-clock";
import { prewarmAudioCdns } from "@/lib/resource-prewarm";
import { tryAutoplay } from "@/lib/feature-permission-shield";
import { wallNowMs } from "@/lib/monotonic-time";

export type PlayerState = "idle" | "loading" | "playing" | "paused" | "error" | "buffering";

export function useAyahPlayer(surahNum: number, totalAyahs: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stallRef = useRef<StallRecoveryHandle | null>(null);
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
  const clockRef = useRef<AudioRafClockHandle | null>(null);
  const preciseTimeRef = useRef(0);

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

  // create audio element once + attach stall recovery
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.playbackRate = playbackRateRef.current;
    audioRef.current = audio;

    const onPhase = (phase: StallRecoveryPhase) => {
      if (phase === "buffering" || phase === "recovering") {
        setPlayerState((s) => (s === "paused" || s === "idle" || s === "error" ? s : "buffering"));
      }
      // successful resume lands on "playing" via the playing listener in loadAndPlay
    };

    stallRef.current = attachAudioStallRecovery(audio, {
      maxAttempts: 3,
      stallGraceMs: 600,
      onPhaseChange: onPhase,
    });

    // High-precision rAF clock — interpolates between coarse browser currentTime updates
    clockRef.current = attachAudioRafClock(audio, {
      minEmitMs: 8,
      onSample: (s) => {
        preciseTimeRef.current = s.mediaTime;
      },
    });

    // Warm CDN TLS early so first play pays less handshake cost
    prewarmAudioCdns();

    return () => {
      clearDelayTimer();
      pauseCleanupRef.current?.();
      pauseCleanupRef.current = null;
      stallRef.current?.dispose();
      stallRef.current = null;
      clockRef.current?.stop();
      clockRef.current = null;
      releaseAudioElement(audio);
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
    stallRef.current?.reset();
    prewarmAudioCdns();

    audio.pause();
    audio.src = getAyahAudioUrl(surah, ayah, reciter);
    audio.playbackRate = playbackRateRef.current;
    setCurrentAyah(ayah);
    setPlayerState("loading");
    preciseTimeRef.current = 0;
    clockRef.current?.resync();
    saveAudioResumeState({
      surah,
      ayah,
      currentTime: 0,
      reciterId: reciter,
      updatedAt: wallNowMs(),
    });

    const onPlaying = () => {
      clockRef.current?.resync();
      setPlayerState("playing");
    };
    const onPause = () => {
      if (audio.ended) return;
      // Keep ayah + timeline; do not clear currentAyah on buffer underrun
      const stallPhase = stallRef.current?.getPhase();
      if (stallPhase === "buffering" || stallPhase === "recovering") {
        setPlayerState("buffering");
        return;
      }
      setPlayerState("paused");
      saveAudioResumeState({
        surah,
        ayah,
        currentTime: preciseTimeRef.current || audio.currentTime || 0,
        reciterId: reciter,
        updatedAt: wallNowMs(),
      });
    };
    const onEnded = () => {
      pauseCleanupRef.current?.();
      pauseCleanupRef.current = null;
      stallRef.current?.reset();

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
    const onError = () => {
      const phase = stallRef.current?.getPhase();
      if (phase === "buffering" || phase === "recovering") return;
      // Network/decode errors that stall recovery already claimed — wait for failed phase
      const code = audio.error?.code;
      if (code === 1 || code === 2 || code === 4) {
        // attachAudioStallRecovery schedules resume; surface error only if attempts exhausted
        if (phase !== "failed") return;
      }
      setPlayerState("error");
    };

    // Keep playing/error listeners for the ayah lifetime so stall resumes update UI state
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded, { once: true });
    audio.addEventListener("error", onError);

    pauseCleanupRef.current = () => {
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onError);
    };

    audio.load();
    /* استدعاء play() فورًا ومتزامنًا مع نفس استدعاء لمسة المستخدم — لا ننتظر
       حدث canplay غير المتزامن. iOS Safari/WebKit (Capacitor WebView أيضًا)
       يُسقِط صلاحية user-gesture لتشغيل صوت إن استُدعيت play() بعد أي جولة
       event-loop لاحقة للمسة الأصلية، فيرفض التشغيل صامتًا (NotAllowedError)
       — هذا هو السبب الجذري الفعلي لعطل التشغيل على iOS تحديدًا (مؤكَّد
       2026-07-22). المتصفح يدير الانتظار الداخلي لتوفر البيانات بنفسه طالما
       استُدعيت play() بالتوقيت الصحيح؛ لا حاجة لانتظار canplay يدويًا. */
    void tryAutoplay(audio).then((ok) => {
      if (!ok) setPlayerState("error");
    });
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
    const audio = audioRef.current;
    if (!audio) return;
    void tryAutoplay(audio).then((ok) => {
      if (!ok) setPlayerState("error");
      else clockRef.current?.resync();
    });
  }, []);

  const stop = useCallback(() => {
    clearDelayTimer();
    const audio = audioRef.current;
    if (!audio) return;
    stallRef.current?.reset();
    releaseAudioElement(audio);
    preciseTimeRef.current = 0;
    setCurrentAyah(null);
    setPlayerState("idle");
  }, [clearDelayTimer]);

  const togglePlayAyah = useCallback((ayah: number) => {
    if (currentAyah === ayah && playerState === "playing") {
      pause();
    } else if (currentAyah === ayah && (playerState === "paused" || playerState === "buffering")) {
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
          playing: playerState === "playing" || playerState === "buffering",
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
    /** Millisecond-grade interpolated media time (rAF clock). */
    getPreciseTime: () => preciseTimeRef.current || audioRef.current?.currentTime || 0,
    getAudioClockSample: () => clockRef.current?.getSample() ?? null,
  };
}
