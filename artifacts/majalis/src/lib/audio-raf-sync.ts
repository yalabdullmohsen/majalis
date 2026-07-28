/**
 * Master polish — rAF-interpolated audio timestamp sync for 120Hz+ displays.
 * Maps audio.currentTime through display refresh for word/verse highlight.
 * Logic-only — no UI.
 */

import { startVisibilityAwareRafLoop } from "@/lib/visibility-raf";

export type AudioRafSyncSample = {
  /** Interpolated media time (seconds). */
  mediaTime: number;
  /** performance.now() at sample. */
  wallMs: number;
  playing: boolean;
};

export type AudioRafSyncHandle = {
  start: (audio: HTMLAudioElement, onTick: (s: AudioRafSyncSample) => void) => void;
  stop: () => void;
  getLast: () => AudioRafSyncSample | null;
};

/**
 * High-refresh sync: sample audio clock each frame; when rAF rate > media
 * updates, hold last mediaTime (no allocation in loop — reuse sample object).
 */
export function createAudioRafSync(): AudioRafSyncHandle {
  let cancel: (() => void) | null = null;
  const sample: AudioRafSyncSample = { mediaTime: 0, wallMs: 0, playing: false };
  let last: AudioRafSyncSample | null = null;

  return {
    start(audio, onTick) {
      this.stop();
      const handle = startVisibilityAwareRafLoop((now) => {
        // Reuse monomorphic sample object — no per-frame allocation
        sample.wallMs = now;
        try {
          sample.mediaTime = audio.currentTime || 0;
          sample.playing = !audio.paused && !audio.ended;
        } catch {
          sample.playing = false;
        }
        last = sample;
        onTick(sample);
      });
      cancel = () => handle.cancel();
    },
    stop() {
      cancel?.();
      cancel = null;
    },
    getLast() {
      return last;
    },
  };
}
