/**
 * Cross-module state harmony — coordinates IndexedDB / audio resume /
 * SM-2 dirty sync / offline pack warm so concurrent async ops do not
 * interleave mid-write or cause state drift.
 * Logic-only — no UI.
 */

import { withMutex } from "@/lib/async-mutex";
import { scheduleNonCriticalWork, getPowerSaverState } from "@/lib/power-saver-engine";

export type HarmonyLane = "audio-resume" | "flashcard-sync" | "offline-pack" | "reading-pos";

/**
 * Exclusive critical section for a named storage/sync lane.
 * Use for: saving audio resume, flushing SM-2 dirty reviews, warming offline packs,
 * persisting mushaf reading position.
 */
export function withHarmonyLock<T>(lane: HarmonyLane, fn: () => Promise<T> | T): Promise<T> {
  return withMutex(lane, fn);
}

/**
 * Defer non-critical harmony work when power-saver is throttling background.
 * Critical lanes (audio-resume, flashcard-sync) always run immediately.
 */
export function scheduleHarmonyWork(
  lane: HarmonyLane,
  fn: () => void | Promise<void>,
): void {
  const critical = lane === "audio-resume" || lane === "flashcard-sync";
  const run = () => {
    void withHarmonyLock(lane, async () => {
      await fn();
    });
  };
  if (critical) {
    run();
    return;
  }
  const ps = getPowerSaverState();
  if (ps.throttleBackground) {
    scheduleNonCriticalWork(run);
  } else {
    run();
  }
}

/** Coalesce concurrent identical async tasks (generation-safe). */
export function coalesceAsync<T>(
  bucket: { current: Promise<T> | null },
  factory: () => Promise<T>,
): Promise<T> {
  if (bucket.current) return bucket.current;
  const p = factory().finally(() => {
    if (bucket.current === p) bucket.current = null;
  });
  bucket.current = p;
  return p;
}
