/**
 * High-precision audio clock — rAF-interpolated media time.
 * Prefer over coarse `timeupdate` (~4Hz) for verse/progress sync on 120Hz displays.
 * Logic-only — no UI.
 */

import { monoNow } from "@/lib/monotonic-time";

export type AudioClockSample = {
  /** Interpolated media seconds (primary sync signal). */
  mediaTime: number;
  /** Last raw HTMLMediaElement.currentTime sample. */
  rawCurrentTime: number;
  /** performance.now() at this sample. */
  performanceStamp: number;
  playbackRate: number;
  playing: boolean;
  /** 0–1 when duration is known. */
  progress: number;
};

export type AudioRafClockHandle = {
  getSample: () => AudioClockSample;
  stop: () => void;
  /** Force resync from element.currentTime. */
  resync: () => void;
};

export type AudioRafClockOptions = {
  onSample?: (sample: AudioClockSample) => void;
  /** Min ms between onSample invocations (default ~8ms ≈ 120Hz). */
  minEmitMs?: number;
};

/**
 * Attach an rAF loop that interpolates between browser currentTime updates.
 * Call stop() on pause/unmount.
 */
export function attachAudioRafClock(
  audio: HTMLAudioElement,
  opts: AudioRafClockOptions = {},
): AudioRafClockHandle {
  const minEmitMs = opts.minEmitMs ?? 8;
  let rafId: number | null = null;
  let stopped = false;
  let lastRaw = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  let lastPerf = monoNow();
  let lastEmitPerf = 0;
  let lastSample: AudioClockSample = {
    mediaTime: lastRaw,
    rawCurrentTime: lastRaw,
    performanceStamp: lastPerf,
    playbackRate: audio.playbackRate || 1,
    playing: !audio.paused && !audio.ended,
    progress: 0,
  };

  const readRaw = () => {
    const raw = audio.currentTime;
    if (Number.isFinite(raw)) {
      // Detect discrete browser updates vs interpolation drift
      if (Math.abs(raw - lastRaw) > 0.0005) {
        lastRaw = raw;
        lastPerf = monoNow();
      }
    }
  };

  const buildSample = (): AudioClockSample => {
    readRaw();
    const now = monoNow();
    const rate = audio.playbackRate || 1;
    const playing = !audio.paused && !audio.ended && audio.readyState >= 2;
    let mediaTime = lastRaw;
    if (playing) {
      mediaTime = lastRaw + ((now - lastPerf) / 1000) * rate;
      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) {
        mediaTime = Math.min(mediaTime, dur);
      }
    }
    const dur = audio.duration;
    const progress =
      Number.isFinite(dur) && dur > 0 ? Math.min(1, Math.max(0, mediaTime / dur)) : 0;
    lastSample = {
      mediaTime,
      rawCurrentTime: lastRaw,
      performanceStamp: now,
      playbackRate: rate,
      playing,
      progress,
    };
    return lastSample;
  };

  const tick = () => {
    if (stopped) return;
    const sample = buildSample();
    if (opts.onSample && sample.performanceStamp - lastEmitPerf >= minEmitMs) {
      lastEmitPerf = sample.performanceStamp;
      opts.onSample(sample);
    }
    if (typeof requestAnimationFrame === "function") {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = window.setTimeout(tick, minEmitMs) as unknown as number;
    }
  };

  const onPlay = () => {
    lastRaw = Number.isFinite(audio.currentTime) ? audio.currentTime : lastRaw;
    lastPerf = monoNow();
    if (!stopped && rafId == null) tick();
  };
  const onPause = () => {
    buildSample();
  };

  audio.addEventListener("play", onPlay);
  audio.addEventListener("playing", onPlay);
  audio.addEventListener("pause", onPause);
  audio.addEventListener("seeked", onPlay);

  if (!audio.paused) tick();

  return {
    getSample: () => buildSample(),
    resync: () => {
      lastRaw = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      lastPerf = monoNow();
    },
    stop: () => {
      stopped = true;
      if (rafId != null) {
        if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(rafId);
        else window.clearTimeout(rafId);
        rafId = null;
      }
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("playing", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("seeked", onPlay);
    },
  };
}
