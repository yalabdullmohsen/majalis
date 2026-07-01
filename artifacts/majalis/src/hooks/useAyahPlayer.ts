/**
 * Per-ayah audio player using everyayah.com.
 * Auto-advances to next ayah when current ends.
 * Reports currently-playing ayah number for visual highlight.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getAyahAudioUrl, loadReciterId, saveReciterId } from "@/lib/quran-audio";

export type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";

export function useAyahPlayer(surahNum: number, totalAyahs: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseCleanupRef = useRef<(() => void) | null>(null);
  const [reciterId, setReciterIdState] = useState<string>(loadReciterId);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");

  const setReciterId = useCallback((id: string) => {
    setReciterIdState(id);
    saveReciterId(id);
  }, []);

  // create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;
    return () => {
      pauseCleanupRef.current?.();
      pauseCleanupRef.current = null;
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const loadAndPlay = useCallback((surah: number, ayah: number, reciter: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Remove previous pause listener before adding a new one
    pauseCleanupRef.current?.();
    pauseCleanupRef.current = null;

    audio.pause();
    audio.src = getAyahAudioUrl(surah, ayah, reciter);
    setCurrentAyah(ayah);
    setPlayerState("loading");

    const onCanPlay = () => {
      audio.play().catch(() => setPlayerState("error"));
    };
    const onPlaying = () => setPlayerState("playing");
    const onPause = () => {
      if (audio.ended) return;
      setPlayerState("paused");
    };
    const onEnded = () => {
      pauseCleanupRef.current?.();
      pauseCleanupRef.current = null;
      if (ayah < totalAyahs) {
        loadAndPlay(surah, ayah + 1, reciter);
      } else {
        setCurrentAyah(null);
        setPlayerState("idle");
      }
    };
    const onError = () => setPlayerState("error");

    audio.addEventListener("canplay", onCanPlay, { once: true });
    audio.addEventListener("playing", onPlaying, { once: true });
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded, { once: true });
    audio.addEventListener("error", onError, { once: true });

    pauseCleanupRef.current = () => audio.removeEventListener("pause", onPause);

    audio.load();
  }, [totalAyahs]);

  const playFromAyah = useCallback((ayah: number) => {
    loadAndPlay(surahNum, ayah, reciterId);
  }, [surahNum, reciterId, loadAndPlay]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => setPlayerState("error"));
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    setCurrentAyah(null);
    setPlayerState("idle");
  }, []);

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
  }, [surahNum, stop]);

  return {
    currentAyah,
    playerState,
    reciterId,
    setReciterId,
    playFromAyah,
    togglePlayAyah,
    pause,
    resume,
    stop,
  };
}
