// خوارزمية SM-2 للتكرار المتباعد
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
 * (Hard ≥ 3 counts as a successful recall with a shorter interval growth.)
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

export function sm2(state: CardState, quality: ReviewQuality): CardState {
  let { interval_days, ease_factor, repetitions } = state;

  if (quality >= 3) {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval_days = 1;
  }

  ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  return { interval_days, ease_factor, repetitions };
}

export function nextReviewDate(intervalDays: number, from: Date = new Date()): Date {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + intervalDays);
  return d;
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
  const normalized: CardState = "easeFactor" in state
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

export function isDue(nextReviewAt: string): boolean {
  return new Date(nextReviewAt) <= new Date();
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
