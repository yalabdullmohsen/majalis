/**
 * AudioEngine — ayah-synced HTML5 playback for the Quran Engine.
 *
 * Status: scaffold only — implement play/pause/seek, repeat, prefetch, offline next.
 */

export type RepeatMode = "off" | "ayah" | "range";

export type AudioEngineSnapshot = {
  playerState: "idle" | "loading" | "playing" | "paused" | "buffering" | "error";
  reciterId: string;
  surah: number | null;
  ayah: number | null;
};

/** Singleton placeholder — replace with real Audio element orchestration. */
export class AudioEngine {
  private static instance: AudioEngine | null = null;

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /** TODO: resolve CDN/IDB URL and play */
  async playAyah(_surah: number, _ayah: number): Promise<void> {}

  /** TODO: toggle play/pause for ayah */
  async togglePlay(_surah: number, _ayah: number): Promise<void> {}

  /** TODO: seek timeline to ayah start */
  async seekToAyah(_surah: number, _ayah: number): Promise<void> {}

  pause(): void {
    // TODO
  }

  setRepeatMode(_mode: RepeatMode): void {
    // TODO
  }

  getSnapshot(): AudioEngineSnapshot {
    return {
      playerState: "idle",
      reciterId: "alafasy",
      surah: null,
      ayah: null,
    };
  }
}

export function getAudioEngine(): AudioEngine {
  return AudioEngine.getInstance();
}
