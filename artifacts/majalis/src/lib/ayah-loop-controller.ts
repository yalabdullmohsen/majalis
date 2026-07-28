/**
 * Quran Audio Memorization & Loop Manager — pure state machine (logic-only).
 * Controls verse-range loops, repeat counts, and silent delay between reps.
 */

export type AyahLoopConfig = {
  /** Inclusive start ayah within the active surah */
  startAyah: number;
  /** Inclusive end ayah (defaults to startAyah for single-ayah drill) */
  endAyah: number;
  /** Total full-range repetitions (1 = play once through the range) */
  repeatCount: number;
  /** Silent pause in ms after each ayah before the next play */
  delayMs: number;
};

export type AyahLoopRuntime = {
  config: AyahLoopConfig;
  /** 0-based completed full passes through the range */
  completedPasses: number;
  /** Next ayah to play within the range */
  nextAyah: number;
  active: boolean;
};

export type AyahLoopAdvance =
  | { action: "play"; ayah: number; delayMs: number }
  | { action: "done" };

export function normalizeLoopConfig(
  partial: Partial<AyahLoopConfig> & { startAyah: number; infinite?: boolean },
  totalAyahs: number,
): AyahLoopConfig {
  const start = clampAyah(partial.startAyah, totalAyahs);
  const endRaw = partial.endAyah ?? start;
  const end = Math.max(start, clampAyah(endRaw, totalAyahs));
  const infinite = partial.infinite === true || partial.repeatCount === 0;
  const repeatCount = infinite
    ? Number.POSITIVE_INFINITY
    : Math.max(1, Math.min(99, Math.floor(partial.repeatCount ?? 1)));
  const delayMs = Math.max(0, Math.min(30_000, Math.floor(partial.delayMs ?? 0)));
  return { startAyah: start, endAyah: end, repeatCount, delayMs };
}

function clampAyah(n: number, total: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(1, Math.floor(n)), Math.max(1, total));
}

export function createLoopRuntime(config: AyahLoopConfig): AyahLoopRuntime {
  return {
    config,
    completedPasses: 0,
    nextAyah: config.startAyah,
    active: true,
  };
}

/**
 * بعد انتهاء آية، قرّر التشغيل التالي (مع تأخير صامت اختياري).
 * Pure — لا مؤقّتات؛ المشغّل يطبّق delayMs قبل الاستدعاء.
 * repeatCount = Infinity يعني تكرارًا لا نهائيًا.
 */
export function advanceAfterAyahEnded(
  runtime: AyahLoopRuntime,
  justFinishedAyah: number,
): { runtime: AyahLoopRuntime; next: AyahLoopAdvance } {
  if (!runtime.active) {
    return { runtime, next: { action: "done" } };
  }

  const { startAyah, endAyah, repeatCount, delayMs } = runtime.config;
  let completedPasses = runtime.completedPasses;
  let nextAyah: number;

  if (justFinishedAyah < endAyah) {
    nextAyah = justFinishedAyah + 1;
  } else {
    completedPasses += 1;
    if (Number.isFinite(repeatCount) && completedPasses >= repeatCount) {
      return {
        runtime: { ...runtime, completedPasses, active: false, nextAyah: startAyah },
        next: { action: "done" },
      };
    }
    nextAyah = startAyah;
  }

  const nextRuntime: AyahLoopRuntime = {
    ...runtime,
    completedPasses,
    nextAyah,
    active: true,
  };
  return {
    runtime: nextRuntime,
    next: { action: "play", ayah: nextAyah, delayMs },
  };
}

/** تكرار آية واحدة بلا نهاية. */
export function singleAyahInfiniteConfig(ayah: number, delayMs = 0): AyahLoopConfig {
  return { startAyah: ayah, endAyah: ayah, repeatCount: Number.POSITIVE_INFINITY, delayMs };
}
