/**
 * Web port of RN expo-av playback speed:
 *
 * ```
 * const changeSpeed = async (newRate) => {
 *   if (soundObject) {
 *     // 0.5 بطيء · 1.0 عادي · 1.5 سريع
 *     await soundObject.setRateAsync(newRate, true);
 *   }
 * };
 * ```
 *
 * HTML5 `HTMLAudioElement.playbackRate` is the web equivalent of
 * `setRateAsync` (sync apply; browsers handle pitch per engine).
 */

import {
  loadPlaybackRate,
  normalizePlaybackRate,
  savePlaybackRate,
  VALID_PLAYBACK_RATES,
} from "@/lib/quran-audio";
import type { AudioEngine } from "@/core/audio/AudioEngine";

export { VALID_PLAYBACK_RATES, normalizePlaybackRate, loadPlaybackRate, savePlaybackRate };

/**
 * Apply a new playback rate to a live audio element (RN `setRateAsync`).
 * Returns the normalized rate that was applied.
 */
export function applyPlaybackRateToElement(
  el: HTMLAudioElement | null | undefined,
  newRate: number,
): number {
  const rate = normalizePlaybackRate(newRate);
  if (el) {
    try {
      el.playbackRate = rate;
    } catch {
      /* ignore */
    }
  }
  savePlaybackRate(rate);
  return rate;
}

/**
 * RN `changeSpeed(newRate)` against the shared {@link AudioEngine}.
 * Safe when no sound is loaded yet — rate is stored and applied on next play.
 */
export async function changeSpeed(
  engine: Pick<AudioEngine, "setPlaybackRate">,
  newRate: number,
): Promise<number> {
  return engine.setPlaybackRate(newRate);
}
