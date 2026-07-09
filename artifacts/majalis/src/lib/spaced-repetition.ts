// خوارزمية SM-2 للتكرار المتباعد
// https://www.supermemo.com/en/articles/twenty-rules

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = نسيان تام, 1 = نسيان مع تذكّر, 2 = صعب, 3 = صحيح بجهد, 4 = صحيح, 5 = سهل جداً

export type CardState = {
  interval_days: number;
  ease_factor: number;
  repetitions: number;
};

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

export function nextReviewDate(intervalDays: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + intervalDays);
  return d;
}

export function isDue(nextReviewAt: string): boolean {
  return new Date(nextReviewAt) <= new Date();
}

export function qualityLabel(q: ReviewQuality): string {
  return (["نسيان تام", "صعب جداً", "صعب", "بجهد", "جيد", "ممتاز"] as const)[q];
}

export const QUALITY_OPTIONS: { value: ReviewQuality; label: string; color: string }[] = [
  { value: 0, label: "لم أتذكر", color: "#dc2626" },
  { value: 2, label: "صعب", color: "#1F4D3A" },
  { value: 4, label: "عرفته", color: "#16a34a" },
  { value: 5, label: "سهل", color: "#0284c7" },
];
