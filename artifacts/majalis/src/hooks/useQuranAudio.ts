/**
 * Web port of RN expo-av `useQuranAudio`:
 *
 * ```ts
 * export const useQuranAudio = () => {
 *   const [sound, setSound] = useState(null);
 *   const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
 *   const playVerse = async (url) => {
 *     const { sound: newSound } = await Audio.Sound.createAsync({ uri: url });
 *     await newSound.setRateAsync(playbackSpeed, true);
 *     setSound(newSound);
 *     await newSound.playAsync();
 *   };
 *   return { playVerse, setPlaybackSpeed };
 * };
 * ```
 *
 * Uses shared {@link AudioEngine} (HTML5 Audio) instead of Expo `Audio.Sound`.
 */
import { useCallback, useEffect, useState } from "react";
import { getAudioEngine, type PlayerState } from "@/core/audio/AudioEngine";
import {
  getAyahAudioUrl,
  loadPlaybackRate,
  normalizePlaybackRate,
} from "@/lib/quran-audio";

export type QuranAudioApi = {
  /** HTMLAudioElement currently owned by the engine (RN `sound`). */
  sound: HTMLAudioElement | null;
  /** Current rate — default 1.0 (RN `playbackSpeed`). */
  playbackSpeed: number;
  /**
   * Play a verse by URL — RN `playVerse(url)` /
   * `Audio.Sound.createAsync({ uri })` + `setRateAsync` + `playAsync`.
   */
  playVerse: (url: string) => Promise<void>;
  /** Convenience: resolve everyayah URL then play. */
  playVerseAt: (surah: number, ayah: number, reciterId?: string) => Promise<void>;
  /**
   * RN `setPlaybackSpeed` / `setRateAsync(rate, true)`.
   * Persists via `mj-quran-playback-rate-v1`.
   */
  setPlaybackSpeed: (rate: number) => void;
  /** Alias used in some RN sketches (`changeSpeed`). */
  changeSpeed: (rate: number) => void;
  stop: () => void;
  playerState: PlayerState;
};

export function useQuranAudio(): QuranAudioApi {
  const audio = getAudioEngine();
  const [snap, setSnap] = useState(() => audio.getSnapshot());
  const [playbackSpeed, setPlaybackSpeedState] = useState(() => loadPlaybackRate());
  const [sound, setSound] = useState<HTMLAudioElement | null>(() => audio.getSound());

  useEffect(() => {
    return audio.onSnapshot((next) => {
      setSnap(next);
      setPlaybackSpeedState(next.playbackRate);
      setSound(audio.getSound());
    });
  }, [audio]);

  /** Cleanup on leave — RN `sound.unloadAsync()`. */
  useEffect(() => {
    return () => {
      audio.stopAndUnload();
      setSound(null);
    };
  }, [audio]);

  const setPlaybackSpeed = useCallback(
    (rate: number) => {
      const applied = audio.setPlaybackRate(rate);
      setPlaybackSpeedState(applied);
    },
    [audio],
  );

  const playVerse = useCallback(
    async (url: string) => {
      if (!url?.trim()) return;
      // RN: setRateAsync(playbackSpeed, true) before playAsync
      audio.setPlaybackRate(normalizePlaybackRate(playbackSpeed));
      await audio.playUrl(url.trim());
      setSound(audio.getSound());
    },
    [audio, playbackSpeed],
  );

  const playVerseAt = useCallback(
    async (surah: number, ayah: number, reciterId?: string) => {
      const id = reciterId ?? snap.reciterId ?? "alafasy";
      if (reciterId) audio.setReciter(reciterId);
      audio.setPlaybackRate(normalizePlaybackRate(playbackSpeed));
      await audio.playAyah(surah, ayah, id);
      setSound(audio.getSound());
      // URL available for callers that log/share it
      void getAyahAudioUrl(surah, ayah, id);
    },
    [audio, playbackSpeed, snap.reciterId],
  );

  const stop = useCallback(() => {
    audio.stop();
  }, [audio]);

  return {
    sound,
    playbackSpeed: snap.playbackRate ?? playbackSpeed,
    playVerse,
    playVerseAt,
    setPlaybackSpeed,
    changeSpeed: setPlaybackSpeed,
    stop,
    playerState: snap.playerState,
  };
}

export default useQuranAudio;
