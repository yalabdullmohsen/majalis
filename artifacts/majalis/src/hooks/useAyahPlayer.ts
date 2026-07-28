/**
 * Per-ayah audio player using everyayah.com.
 * Auto-advances to next ayah when current ends.
 * Silent auto-retry with exponential backoff on transient stream failures.
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
import { decideAudioRetry, isTransientMediaError } from "@/lib/audio-retry";
import { beginProtectedSession, endProtectedSession } from "@/lib/protected-session";

export type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";

const MAX_AUDIO_RETRIES = 3;

export function useAyahPlayer(surahNum: number, totalAyahs: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseCleanupRef = useRef<(() => void) | null>(null);
  const delayTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const retryAttemptRef = useRef(0);
  const playTokenRef = useRef(0);
  const [reciterId, setReciterIdState] = useState<string>(loadReciterId);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [playbackRate, setPlaybackRateState] = useState<number>(loadPlaybackRate);
  const [repeatOn, setRepeatOnState] = useState(false);
  const repeatOnRef = useRef(repeatOn);
  const playbackRateRef = useRef(playbackRate);
  const loopRuntimeRef = useRef<AyahLoopRuntime | null>(null);
  const [loopConfig, setLoopConfigState] = useState<AyahLoopConfig | null>(null);
  const loadAndPlayRef = useRef<(surah: number, ayah: number, reciter: string, attempt?: number) => void>(
    () => undefined,
  );

  const clearDelayTimer = useCallback(() => {
    if (delayTimerRef.current != null) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
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
    const audio = new Audio();
    audio.preload = "none";
    audio.playbackRate = playbackRateRef.current;
    audioRef.current = audio;
    return () => {
      playTokenRef.current += 1;
      clearDelayTimer();
      clearRetryTimer();
      pauseCleanupRef.current?.();
      pauseCleanupRef.current = null;
      endProtectedSession();
      audio.pause();
      audio.removeAttribute("src");
      audio.src = "";
      try {
        audio.load();
      } catch {
        /* ignore */
      }
      audioRef.current = null;
    };
  }, [clearDelayTimer, clearRetryTimer]);

  // Retry current ayah silently when network returns after a stream drop
  useEffect(() => {
    const onOnline = () => {
      if (playerState === "error" && currentAyah != null) {
        retryAttemptRef.current = 0;
        loadAndPlayRef.current(surahNum, currentAyah, reciterId, 0);
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [playerState, currentAyah, surahNum, reciterId]);

  const loadAndPlay = useCallback(
    (surah: number, ayah: number, reciter: string, attempt = 0) => {
      const audio = audioRef.current;
      if (!audio) return;

      const token = ++playTokenRef.current;
      clearDelayTimer();
      clearRetryTimer();
      pauseCleanupRef.current?.();
      pauseCleanupRef.current = null;
      retryAttemptRef.current = attempt;

      audio.pause();
      // Cache-bust on retry to avoid sticky corrupt/partial buffer
      const baseUrl = getAyahAudioUrl(surah, ayah, reciter);
      audio.src = attempt > 0 ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}r=${attempt}` : baseUrl;
      audio.playbackRate = playbackRateRef.current;
      setCurrentAyah(ayah);
      setPlayerState("loading");
      beginProtectedSession("quran-audio");
      saveAudioResumeState({
        surah,
        ayah,
        currentTime: 0,
        reciterId: reciter,
        updatedAt: Date.now(),
      });

      const scheduleRetry = (err: unknown) => {
        if (token !== playTokenRef.current) return;
        const decision = decideAudioRetry(err, attempt, MAX_AUDIO_RETRIES);
        if (decision.action === "retry" && isTransientMediaError(audio)) {
          setPlayerState("loading");
          retryTimerRef.current = window.setTimeout(() => {
            if (token !== playTokenRef.current) return;
            loadAndPlayRef.current(surah, ayah, reciter, attempt + 1);
          }, decision.delayMs);
          return;
        }
        setPlayerState("error");
        endProtectedSession();
      };

      const onPlaying = () => {
        if (token !== playTokenRef.current) return;
        retryAttemptRef.current = 0;
        setPlayerState("playing");
        beginProtectedSession("quran-audio");
      };
      const onPause = () => {
        if (token !== playTokenRef.current) return;
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
        if (token !== playTokenRef.current) return;
        pauseCleanupRef.current?.();
        pauseCleanupRef.current = null;

        const loopRt = loopRuntimeRef.current;
        if (loopRt?.active) {
          const { runtime, next } = advanceAfterAyahEnded(loopRt, ayah);
          loopRuntimeRef.current = runtime;
          if (next.action === "play") {
            const playNext = () => loadAndPlayRef.current(surah, next.ayah, reciter, 0);
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
          endProtectedSession();
          return;
        }

        if (repeatOnRef.current) {
          loadAndPlayRef.current(surah, ayah, reciter, 0);
        } else if (ayah < totalAyahs) {
          loadAndPlayRef.current(surah, ayah + 1, reciter, 0);
        } else {
          setCurrentAyah(null);
          setPlayerState("idle");
          endProtectedSession();
        }
      };
      const onError = () => {
        if (token !== playTokenRef.current) return;
        scheduleRetry(audio.error || new Error("media_error"));
      };
      const onStalled = () => {
        // Soft signal — do not fail immediately; network may recover
        if (token !== playTokenRef.current) return;
        if (!audio.paused && attempt === 0) {
          /* keep playing; browser buffers */
        }
      };

      audio.addEventListener("playing", onPlaying, { once: true });
      audio.addEventListener("pause", onPause);
      audio.addEventListener("ended", onEnded, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.addEventListener("stalled", onStalled);

      pauseCleanupRef.current = () => {
        audio.removeEventListener("pause", onPause);
        audio.removeEventListener("playing", onPlaying);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
        audio.removeEventListener("stalled", onStalled);
      };

      audio.load();
      audio.play().catch((err) => {
        if (token !== playTokenRef.current) return;
        scheduleRetry(err);
      });
    },
    [totalAyahs, clearDelayTimer, clearRetryTimer],
  );

  loadAndPlayRef.current = loadAndPlay;

  const playFromAyah = useCallback(
    (ayah: number) => {
      loadAndPlay(surahNum, ayah, reciterId, 0);
    },
    [surahNum, reciterId, loadAndPlay],
  );

  const pause = useCallback(() => {
    clearDelayTimer();
    clearRetryTimer();
    audioRef.current?.pause();
  }, [clearDelayTimer, clearRetryTimer]);

  const resume = useCallback(() => {
    beginProtectedSession("quran-audio");
    audioRef.current?.play().catch((err) => {
      const decision = decideAudioRetry(err, 0, MAX_AUDIO_RETRIES);
      if (decision.action === "fail") setPlayerState("error");
      else if (currentAyah != null) {
        retryTimerRef.current = window.setTimeout(() => {
          loadAndPlayRef.current(surahNum, currentAyah, reciterId, 1);
        }, decision.delayMs);
      }
    });
  }, [currentAyah, surahNum, reciterId]);

  const stop = useCallback(() => {
    playTokenRef.current += 1;
    clearDelayTimer();
    clearRetryTimer();
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.src = "";
    try {
      audio.load();
    } catch {
      /* ignore */
    }
    setCurrentAyah(null);
    setPlayerState("idle");
    endProtectedSession();
  }, [clearDelayTimer, clearRetryTimer]);

  const togglePlayAyah = useCallback(
    (ayah: number) => {
      if (currentAyah === ayah && playerState === "playing") {
        pause();
      } else if (currentAyah === ayah && playerState === "paused") {
        resume();
      } else if (currentAyah === ayah && playerState === "error") {
        playFromAyah(ayah);
      } else {
        playFromAyah(ayah);
      }
    },
    [currentAyah, playerState, pause, resume, playFromAyah],
  );

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
    loopConfig,
    setLoopConfig,
    playFromAyah,
    togglePlayAyah,
    pause,
    resume,
    stop,
    audioElement: audioRef,
  };
}
