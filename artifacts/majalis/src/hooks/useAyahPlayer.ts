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
import { prewarmAudioCdns, prewarmUrl } from "@/lib/resource-prewarm";
import {
  applyAudioBufferPolicy,
  getAudioBufferPolicy,
  observeAudioLatency,
  observeAudioThroughput,
} from "@/lib/audio-buffer-policy";
import { logDiagnostic } from "@/lib/diagnostics";
import { useWakeLock } from "@/hooks/useWakeLock";
import { holdPreviousWhileLoading } from "@/lib/cls-layout-reserve";

export type PlayerState = "idle" | "loading" | "playing" | "paused" | "error" | "buffering";

export function useAyahPlayer(surahNum: number, totalAyahs: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stallRef = useRef<StallRecoveryHandle | null>(null);
  const pauseCleanupRef = useRef<(() => void) | null>(null);
  const delayTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const lastAyahRef = useRef<number | null>(null);
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

  // Part 19: keep screen awake only while actively playing; release on pause/blur
  useWakeLock(playerState === "playing" || playerState === "buffering" || playerState === "loading");

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

  /** RN `changeSpeed(newRate)` — alias of {@link setPlaybackRate}. */
  const changeSpeed = useCallback(
    async (newRate: number) => {
      setPlaybackRate(newRate);
      return newRate;
    },
    [setPlaybackRate],
  );

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

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // create audio element once + attach stall recovery
  useEffect(() => {
    const audio = new Audio();
    const policy = getAudioBufferPolicy();
    applyAudioBufferPolicy(audio, policy);
    audio.playbackRate = playbackRateRef.current;
    audioRef.current = audio;

    const onPhase = (phase: StallRecoveryPhase) => {
      if (!mountedRef.current) return;
      if (phase === "buffering" || phase === "recovering") {
        setPlayerState((s) => (s === "paused" || s === "idle" || s === "error" ? s : "buffering"));
        logDiagnostic("audio-stall", phase);
      }
    };

    stallRef.current = attachAudioStallRecovery(audio, {
      maxAttempts: policy.maxStallAttempts,
      stallGraceMs: policy.stallGraceMs,
      onPhaseChange: onPhase,
    });

    prewarmAudioCdns();

    return () => {
      clearDelayTimer();
      pauseCleanupRef.current?.();
      pauseCleanupRef.current = null;
      stallRef.current?.dispose();
      stallRef.current = null;
      releaseAudioElement(audio);
      audioRef.current = null;
    };
  }, [clearDelayTimer]);

  const loadAndPlay = useCallback((surah: number, ayah: number, reciter: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    clearDelayTimer();
    pauseCleanupRef.current?.();
    pauseCleanupRef.current = null;
    stallRef.current?.reset();
    prewarmAudioCdns();

    const policy = getAudioBufferPolicy();
    applyAudioBufferPolicy(audio, policy);

    const t0 = performance.now();
    audio.pause();
    audio.src = getAyahAudioUrl(surah, ayah, reciter);
    audio.playbackRate = playbackRateRef.current;
    if (mountedRef.current) {
      setCurrentAyah(ayah);
      setPlayerState("loading");
    }
    saveAudioResumeState({
      surah,
      ayah,
      currentTime: 0,
      reciterId: reciter,
      updatedAt: Date.now(),
    });

    const onPlaying = () => {
      if (!mountedRef.current) return;
      const latency = performance.now() - t0;
      observeAudioLatency(latency);
      // Rough throughput sample from typical ayah size (~80KB) / latency
      if (latency > 0) observeAudioThroughput(80_000, latency);
      setPlayerState("playing");
      if (policy.warmNextAyah && ayah < totalAyahs) {
        prewarmUrl(getAyahAudioUrl(surah, ayah + 1, reciter), { mode: "cors" });
      }
    };
    const onPause = () => {
      if (!mountedRef.current || audio.ended) return;
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
        currentTime: audio.currentTime || 0,
        reciterId: reciter,
        updatedAt: Date.now(),
      });
    };
    const onEnded = () => {
      pauseCleanupRef.current?.();
      pauseCleanupRef.current = null;
      stallRef.current?.reset();
      if (!mountedRef.current) return;

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
      if (!mountedRef.current) return;
      logDiagnostic("audio-chunk-fail", "ayah audio error", { surah, ayah, reciter, code });
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
    audio.play().catch(() => {
      if (!mountedRef.current) return;
      setPlayerState("error");
      logDiagnostic("audio-chunk-fail", "play-rejected", { surah, ayah });
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
    audioRef.current?.play().catch(() => setPlayerState("error"));
  }, []);

  const stop = useCallback(() => {
    clearDelayTimer();
    const audio = audioRef.current;
    if (!audio) return;
    stallRef.current?.reset();
    audio.pause();
    try {
      audio.removeAttribute("src");
      audio.src = "";
      audio.load();
    } catch {
      /* ignore */
    }
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

  // Part 21 CLS shield: hold previous ayah highlight during loading/buffering
  // so word/ayah highlight does not unmount → remount (layout shift).
  if (currentAyah != null) lastAyahRef.current = currentAyah;
  const stickyAyah = holdPreviousWhileLoading(
    lastAyahRef.current,
    currentAyah,
    playerState === "loading" || playerState === "buffering",
  );
  if (playerState === "idle") lastAyahRef.current = null;

  return {
    currentAyah: stickyAyah,
    playerState,
    reciterId,
    setReciterId,
    playbackRate,
    setPlaybackRate,
    changeSpeed,
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
