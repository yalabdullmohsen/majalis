/**
 * Web port of the RN expo-av sketch:
 * `sound` / `isPlaying` / `toggleAudio(uri)` + unload on unmount.
 *
 * Uses the shared {@link AudioEngine} (HTML5 Audio) and everyayah URLs
 * instead of Expo `Audio.Sound.createAsync`.
 *
 * Reciter selection follows the RN sketch:
 * `selectedReciter` + `getAudioUrl(verseNumber)` via `@/lib/quran-reciters`.
 */
import { useCallback, useEffect, useState } from "react";
import { getAudioEngine, type PlayerState } from "@/core/audio/AudioEngine";
import {
  DEFAULT_SELECTED_RECITER,
  getAudioUrl,
  getAudioUrlForAyah,
  resolveReciterId,
} from "@/lib/quran-reciters";

export type QuranAudioToggleApi = {
  /** Play or stop the given ayah (RN `toggleAudio`). */
  toggleAudio: (surah: number, ayah: number) => Promise<void>;
  /** True when this ayah is currently playing/buffering. */
  isPlayingAyah: (surah: number, ayah: number) => boolean;
  playerState: PlayerState;
  /** Resolved everyayah URI for the ayah (RN `getAudioUrl` / `audioUri`). */
  getAudioUri: (surah: number, ayah: number) => string;
  /**
   * RN `getAudioUrl(verseNumber)` — `verseNumber` is the SSSAAA file stem
   * (e.g. `"002255"`), relative to the selected reciter's `baseUrl`.
   */
  getAudioUrl: (verseNumber: string | number) => string;
};

export function useQuranAudioToggle(reciterId?: string): QuranAudioToggleApi {
  const audio = getAudioEngine();
  const [snap, setSnap] = useState(() => audio.getSnapshot());
  const selectedReciter = resolveReciterId(
    reciterId ?? snap.reciterId ?? DEFAULT_SELECTED_RECITER,
  );

  useEffect(() => {
    if (reciterId) audio.setReciter(resolveReciterId(reciterId));
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
      audio.setReciter(selectedReciter);
      await audio.playAyah(surah, ayah);
    },
    [audio, selectedReciter],
  );

  const isPlayingAyah = useCallback(
    (surah: number, ayah: number) =>
      snap.surah === surah &&
      snap.ayah === ayah &&
      (snap.playerState === "playing" || snap.playerState === "buffering"),
    [snap],
  );

  const getAudioUri = useCallback(
    (surah: number, ayah: number) => getAudioUrlForAyah(surah, ayah, selectedReciter),
    [selectedReciter],
  );

  const getAudioUrlBound = useCallback(
    (verseNumber: string | number) => getAudioUrl(verseNumber, selectedReciter),
    [selectedReciter],
  );

  return {
    toggleAudio,
    isPlayingAyah,
    playerState: snap.playerState,
    getAudioUri,
    getAudioUrl: getAudioUrlBound,
  };
}
