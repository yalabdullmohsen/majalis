/**
 * Spaced Repetition SM-2 — integer-precision intervals & ease factors.
 * Eliminates floating-point drift so offline/online schedules stay bit-stable.
 * Logic-only — no UI.
 */

// https://www.supermemo.com/en/articles/twenty-rules

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = نسيان تام, 1 = نسيان مع تذكّر, 2 = صعب جداً, 3 = صعب/بجهد, 4 = جيد, 5 = سهل

/** Anki-style rating labels mapped onto SM-2 qualities. */
export type ReviewRating = "again" | "hard" | "good" | "easy";

export type CardState = {
  interval_days: number;
  ease_factor: number;
  repetitions: number;
};

/** Explicit metrics tracked per flashcard (camelCase helpers). */
export type Sm2CardMetrics = {
  easeFactor: number;
  interval: number;
  /** Consecutive successful reviews (SM-2 `repetition` / n). */
  repetitions: number;
  nextReviewDate: string; // ISO
};

export const INITIAL_CARD_STATE: CardState = {
  interval_days: 0,
  ease_factor: 2.5,
  repetitions: 0,
};

/**
 * Map Again / Hard / Good / Easy → SM-2 quality 0–5.
 * Spec: Again[0], Hard[3], Good[4], Easy[5]
 */
export const RATING_TO_QUALITY: Record<ReviewRating, ReviewQuality> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

export function ratingToQuality(rating: ReviewRating): ReviewQuality {
  return RATING_TO_QUALITY[rating];
}

/** Fixed 2-decimal ease — prevents IEEE754 drift across sessions. */
export function quantizeEaseFactor(ef: number): number {
  const clamped = Math.max(1.3, ef);
  return Math.round(clamped * 100) / 100;
}

/** Whole-day intervals only — no fractional day drift. */
export function quantizeIntervalDays(days: number): number {
  if (!Number.isFinite(days) || days <= 0) return 1;
  return Math.max(1, Math.round(days));
}

/**
 * Canonical calendar day key (UTC midnight) for stable offline/online sync.
 */
export function toUtcDayKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Add whole days to a UTC calendar date — avoids DST / local TZ float issues.
 */
export function addUtcDays(from: Date, days: number): Date {
  const whole = quantizeIntervalDays(days);
  const base = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return new Date(base + whole * 86_400_000);
}

export function sm2(state: CardState, quality: ReviewQuality): CardState {
  let interval_days = quantizeIntervalDays(state.interval_days || 0);
  let ease_factor = quantizeEaseFactor(state.ease_factor || 2.5);
  let repetitions = Math.max(0, Math.floor(state.repetitions || 0));

  if (quality >= 3) {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else {
      // Multiply in centi-ease (×100) then divide — integer path before round
      const centi = Math.round(ease_factor * 100);
      interval_days = quantizeIntervalDays((interval_days * centi) / 100);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval_days = 1;
  }

  // Classic SM-2 ease update, then quantize
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  ease_factor = quantizeEaseFactor(ease_factor + delta);

  return { interval_days, ease_factor, repetitions };
}

export function nextReviewDate(intervalDays: number, from: Date = new Date()): Date {
  return addUtcDays(from, intervalDays);
}

/**
 * Apply a named rating and return full SM-2 metrics including nextReviewDate.
 */
export function applyReviewRating(
  state: CardState | Sm2CardMetrics,
  rating: ReviewRating | ReviewQuality,
  from: Date = new Date(),
): Sm2CardMetrics {
  const quality = typeof rating === "number" ? rating : ratingToQuality(rating);
  const normalized: CardState =
    "easeFactor" in state
      ? {
          interval_days: state.interval,
          ease_factor: state.easeFactor,
          repetitions: state.repetitions,
        }
      : state;

  const next = sm2(normalized, quality);
  const due = nextReviewDate(next.interval_days, from);
  return {
    easeFactor: next.ease_factor,
    interval: next.interval_days,
    repetitions: next.repetitions,
    nextReviewDate: due.toISOString(),
  };
}

/** Convenience: compute next review ISO from current card fields + quality. */
export function computeNextReview(
  easeFactor: number,
  interval: number,
  repetitions: number,
  quality: ReviewQuality | ReviewRating,
): Sm2CardMetrics {
  return applyReviewRating(
    { easeFactor, interval, repetitions, nextReviewDate: new Date().toISOString() },
    quality,
  );
}

/** Named rating handlers for Flashcards UI / services. */
export const rateAgain = (state: CardState | Sm2CardMetrics, from?: Date) =>
  applyReviewRating(state, "again", from);
export const rateHard = (state: CardState | Sm2CardMetrics, from?: Date) =>
  applyReviewRating(state, "hard", from);
export const rateGood = (state: CardState | Sm2CardMetrics, from?: Date) =>
  applyReviewRating(state, "good", from);
export const rateEasy = (state: CardState | Sm2CardMetrics, from?: Date) =>
  applyReviewRating(state, "easy", from);

export function isDue(nextReviewAt: string, now: Date = new Date()): boolean {
  const t = Date.parse(nextReviewAt);
  if (!Number.isFinite(t)) return true;
  return t <= now.getTime();
}

export function qualityLabel(q: ReviewQuality): string {
  return (["نسيان تام", "صعب جداً", "صعب", "بجهد", "جيد", "ممتاز"] as const)[q];
}

/** UI button set — values match Again/Hard/Good/Easy (0/3/4/5). */
export const QUALITY_OPTIONS: { value: ReviewQuality; label: string; color: string }[] = [
  { value: 0, label: "لم أتذكر", color: "#dc2626" },
  { value: 3, label: "صعب", color: "#143F35" },
  { value: 4, label: "عرفته", color: "#16a34a" },
  { value: 5, label: "سهل", color: "#0284c7" },
];

/** Same buttons as QUALITY_OPTIONS with Anki-style English keys for logic layers. */
export const RATING_OPTIONS: { rating: ReviewRating; quality: ReviewQuality; label: string }[] = [
  { rating: "again", quality: 0, label: "Again" },
  { rating: "hard", quality: 3, label: "Hard" },
  { rating: "good", quality: 4, label: "Good" },
  { rating: "easy", quality: 5, label: "Easy" },
];
