/**
 * Unit tests — offline SM-2 helpers, streak freeze, card export module surface.
 * Run: npx tsx src/lib/__tests__/offline-sm2-streaks.test.ts
 */
import assert from "node:assert/strict";
import {
  applyReviewRating,
  computeNextReview,
  INITIAL_CARD_STATE,
  ratingToQuality,
  sm2,
  RATING_TO_QUALITY,
} from "../spaced-repetition";
import {
  getUserStreak,
  recordUserActivity,
  reconcileStreak,
  type UserStreakState,
} from "../user-streak";

// ── SM-2 ratings ─────────────────────────────────────────────────────────────
assert.equal(ratingToQuality("again"), 0);
assert.equal(ratingToQuality("hard"), 2);
assert.equal(ratingToQuality("good"), 4);
assert.equal(ratingToQuality("easy"), 5);
assert.equal(RATING_TO_QUALITY.good, 4);

{
  const first = applyReviewRating(INITIAL_CARD_STATE, "good");
  assert.equal(first.repetitions, 1);
  assert.equal(first.interval, 1);
  assert.ok(first.nextReviewDate);
  assert.equal(typeof first.easeFactor, "number");

  const second = applyReviewRating(
    {
      easeFactor: first.easeFactor,
      interval: first.interval,
      repetitions: first.repetitions,
      nextReviewDate: first.nextReviewDate,
    },
    "good",
  );
  assert.equal(second.repetitions, 2);
  assert.equal(second.interval, 6);

  const again = applyReviewRating(second, "again");
  assert.equal(again.repetitions, 0);
  assert.equal(again.interval, 1);
}

{
  const viaQuality = computeNextReview(2.5, 0, 0, 5);
  const viaRating = computeNextReview(2.5, 0, 0, "easy");
  assert.equal(viaQuality.interval, viaRating.interval);
  assert.equal(viaQuality.repetitions, viaRating.repetitions);
}

// Legacy sm2 still matches applyReviewRating for q=4
{
  const a = sm2({ interval_days: 0, ease_factor: 2.5, repetitions: 0 }, 4);
  const b = applyReviewRating(INITIAL_CARD_STATE, 4);
  assert.equal(a.interval_days, b.interval);
  assert.equal(a.repetitions, b.repetitions);
}

// ── Streak freeze ────────────────────────────────────────────────────────────
{
  const broken: UserStreakState = {
    currentStreak: 5,
    longestStreak: 10,
    lastActiveDate: "2026-07-20",
    totalGoalsCompleted: 3,
    freezeTokens: 1,
    freezeUsedOn: null,
  };
  // Today = 2026-07-22 → gap 2 days → freeze consumes, lastActive becomes yesterday
  const frozen = reconcileStreak(broken, "2026-07-22");
  assert.equal(frozen.freezeTokens, 0);
  assert.equal(frozen.currentStreak, 5);
  assert.equal(frozen.lastActiveDate, "2026-07-21");
}

{
  const noFreeze: UserStreakState = {
    currentStreak: 4,
    longestStreak: 4,
    lastActiveDate: "2026-07-18",
    totalGoalsCompleted: 1,
    freezeTokens: 0,
    freezeUsedOn: null,
  };
  const reset = reconcileStreak(noFreeze, "2026-07-22");
  assert.equal(reset.currentStreak, 0);
}

// getUserStreak / recordUserActivity smoke (jsdom-less: localStorage may be absent)
if (typeof localStorage !== "undefined") {
  localStorage.removeItem("majalis-user-streak-v1");
  const after = recordUserActivity("quran", { completedGoal: true });
  assert.ok(after.currentStreak >= 1);
  assert.ok(after.totalGoalsCompleted >= 1);
  assert.equal(getUserStreak().currentStreak, after.currentStreak);
}

console.log("offline-sm2-streaks.test.ts: ok");
