/**
 * Audio tracking cursor — highlights the ayah currently recited by AudioEngine
 * (Master Prompt §3 Audio Synchronization). Loose coupling: read-only subscribe.
 */
import { useEffect, useState } from "react";
import { getAudioEngine, type PlayerState } from "@/core/audio/AudioEngine";

export type AudioTrackingCursor = {
  surah: number | null;
  ayah: number | null;
  /** 0-based index when `ayahBase` provided (ayah 1 → index 0). */
  verseIndex: number | null;
  playerState: PlayerState;
  isReciting: boolean;
};

/**
 * @param ayahBase — first ayah number on the current page/list (default 1).
 *                   Used to map engine ayah → list index.
 */
export function useAudioTrackingCursor(ayahBase = 1): AudioTrackingCursor {
  const audio = getAudioEngine();
  const [surah, setSurah] = useState<number | null>(null);
  const [ayah, setAyah] = useState<number | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");

  useEffect(() => {
    const snap0 = audio.getSnapshot();
    setSurah(snap0.surah);
    setAyah(snap0.ayah);
    setPlayerState(snap0.playerState);

    const unAyah = audio.onAyahChange((p) => {
      setSurah(p.surah);
      setAyah(p.ayah);
    });
    const unSnap = audio.onSnapshot((s) => {
      setSurah(s.surah);
      setAyah(s.ayah);
      setPlayerState(s.playerState);
    });
    return () => {
      unAyah();
      unSnap();
    };
  }, [audio]);

  const isReciting =
    playerState === "playing" || playerState === "buffering" || playerState === "loading";

  const verseIndex =
    ayah != null && Number.isFinite(ayah) ? Math.max(0, ayah - ayahBase) : null;

  return {
    surah,
    ayah,
    verseIndex: isReciting ? verseIndex : null,
    playerState,
    isReciting,
  };
}

export default useAudioTrackingCursor;
