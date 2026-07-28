/**
 * Web port of the RN expo-av sketch:
 * `sound` / `isPlaying` / `toggleAudio(uri)` + unload on unmount.
 * `changeSpeed(newRate)` → AudioEngine `setPlaybackRate` (RN `setRateAsync`).
 *
 * Uses the shared {@link AudioEngine} (HTML5 Audio) and everyayah URLs
 * instead of Expo `Audio.Sound.createAsync`.
 */
import { useCallback, useEffect, useState } from "react";
import { getAudioEngine, type PlayerState } from "@/core/audio/AudioEngine";
import { getAyahAudioUrl } from "@/lib/quran-audio";

export type QuranAudioToggleApi = {
  /** Play or stop the given ayah (RN `toggleAudio`). */
  toggleAudio: (surah: number, ayah: number) => Promise<void>;
  /** True when this ayah is currently playing/buffering. */
  isPlayingAyah: (surah: number, ayah: number) => boolean;
  playerState: PlayerState;
  /** Resolved everyayah URI for the ayah (RN `audioUri`). */
  getAudioUri: (surah: number, ayah: number) => string;
  /** Current rate (0.5–2). */
  playbackRate: number;
  /**
   * RN `changeSpeed(newRate)` — 0.5 بطيء · 1 عادي · 1.5 سريع.
   * Web: `HTMLAudioElement.playbackRate` (+ persist).
   */
  changeSpeed: (newRate: number) => Promise<number>;
  setPlaybackRate: (newRate: number) => number;
};

export function useQuranAudioToggle(reciterId?: string): QuranAudioToggleApi {
  const audio = getAudioEngine();
  const [snap, setSnap] = useState(() => audio.getSnapshot());

  useEffect(() => {
    if (reciterId) audio.setReciter(reciterId);
  }, [audio, reciterId]);

  useEffect(() => audio.onSnapshot(setSnap), [audio]);

  /** Cleanup memory on leave — RN `sound.unloadAsync()`. */
  useEffect(() => {
    return () => {
      audio.stopAndUnload();
    };
  }, [audio]);

  const toggleAudio = useCallback(
    async (surah: number, ayah: number) => {
      const current = audio.getSnapshot();
      const same =
        current.surah === surah &&
        current.ayah === ayah &&
        (current.playerState === "playing" || current.playerState === "buffering");
      if (same) {
        // RN sketch: stopAsync when already playing
        audio.stop();
        return;
      }
      if (reciterId) audio.setReciter(reciterId);
      await audio.playAyah(surah, ayah);
    },
    [audio, reciterId],
  );

  const isPlayingAyah = useCallback(
    (surah: number, ayah: number) =>
      snap.surah === surah &&
      snap.ayah === ayah &&
      (snap.playerState === "playing" || snap.playerState === "buffering"),
    [snap],
  );

  const getAudioUri = useCallback(
    (surah: number, ayah: number) =>
      getAyahAudioUrl(surah, ayah, reciterId ?? snap.reciterId ?? "alafasy"),
    [reciterId, snap.reciterId],
  );

  const setPlaybackRate = useCallback(
    (newRate: number) => audio.setPlaybackRate(newRate),
    [audio],
  );

  const changeSpeed = useCallback(
    async (newRate: number) => audio.changeSpeed(newRate),
    [audio],
  );

  return {
    toggleAudio,
    isPlayingAyah,
    playerState: snap.playerState,
    getAudioUri,
    playbackRate: snap.playbackRate,
    changeSpeed,
    setPlaybackRate,
  };
}
