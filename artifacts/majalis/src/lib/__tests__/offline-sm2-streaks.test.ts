/**
 * Unit tests — Dexie offline API surface, SM-2 ratings, streak rules.
 * Run: npx tsx src/lib/__tests__/offline-sm2-streaks.test.ts
 */
import assert from "node:assert/strict";
import {
  applyReviewRating,
  computeNextReview,
  INITIAL_CARD_STATE,
  rateAgain,
  rateEasy,
  rateGood,
  rateHard,
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
import { CARD_EXPORT_PRESETS } from "../card-image-export";
import { OFFLINE_STORES } from "../offline-engine";

// ── Offline engine store names ───────────────────────────────────────────────
assert.ok(OFFLINE_STORES.quran);
assert.ok(OFFLINE_STORES.adhkar);
assert.ok(OFFLINE_STORES.articles);
assert.ok(OFFLINE_STORES.flashcards);

// ── SM-2 ratings (Again=0, Hard=3, Good=4, Easy=5) ───────────────────────────
assert.equal(ratingToQuality("again"), 0);
assert.equal(ratingToQuality("hard"), 3);
assert.equal(ratingToQuality("good"), 4);
assert.equal(ratingToQuality("easy"), 5);
assert.equal(RATING_TO_QUALITY.hard, 3);

{
  const first = rateGood(INITIAL_CARD_STATE);
  assert.equal(first.repetitions, 1);
  assert.equal(first.interval, 1);
  assert.ok(first.nextReviewDate);
  assert.ok(first.easeFactor >= 1.3);

  const second = rateGood(first);
  assert.equal(second.repetitions, 2);
  assert.equal(second.interval, 6);

  // Hard (q=3) is still a successful recall
  const hard = rateHard(second);
  assert.equal(hard.repetitions, 3);
  assert.ok(hard.interval >= 6);

  const again = rateAgain(hard);
  assert.equal(again.repetitions, 0);
  assert.equal(again.interval, 1);

  const easy = rateEasy(INITIAL_CARD_STATE);
  assert.ok(easy.easeFactor > 2.5);
}

{
  const viaQuality = computeNextReview(2.5, 0, 0, 5);
  const viaRating = computeNextReview(2.5, 0, 0, "easy");
  assert.equal(viaQuality.interval, viaRating.interval);
  assert.equal(viaQuality.repetitions, viaRating.repetitions);
}

{
  const a = sm2({ interval_days: 0, ease_factor: 2.5, repetitions: 0 }, 4);
  const b = applyReviewRating(INITIAL_CARD_STATE, 4);
  assert.equal(a.interval_days, b.interval);
  assert.equal(a.repetitions, b.repetitions);
}

// ── Streak rules (no freeze by default) ──────────────────────────────────────
{
  // Gap ≥ 2 without freeze → display broken (0)
  const broken: UserStreakState = {
    currentStreak: 5,
    longestStreak: 10,
    lastActiveDate: "2026-07-20",
    totalGoalsCompleted: 3,
    freezeTokens: 0,
    freezeUsedOn: null,
  };
  const reset = reconcileStreak(broken, "2026-07-22");
  assert.equal(reset.currentStreak, 0);
}

{
  // With freeze token → bridge one missed day
  const withFreeze: UserStreakState = {
    currentStreak: 5,
    longestStreak: 10,
    lastActiveDate: "2026-07-20",
    totalGoalsCompleted: 3,
    freezeTokens: 1,
    freezeUsedOn: null,
  };
  const frozen = reconcileStreak(withFreeze, "2026-07-22");
  assert.equal(frozen.freezeTokens, 0);
  assert.equal(frozen.currentStreak, 5);
  assert.equal(frozen.lastActiveDate, "2026-07-21");
}

// ── Card export presets ──────────────────────────────────────────────────────
assert.equal(CARD_EXPORT_PRESETS.story.aspect, "9:16");
assert.equal(CARD_EXPORT_PRESETS.feed.aspect, "1:1");
assert.ok(CARD_EXPORT_PRESETS.story.pixelRatio >= 3);

if (typeof localStorage !== "undefined") {
  localStorage.removeItem("majalis-user-streak-v1");
  const after = recordUserActivity("quran", { completedGoal: true });
  assert.ok(after.currentStreak >= 1);
  assert.ok(after.totalGoalsCompleted >= 1);
  assert.equal(getUserStreak().currentStreak, after.currentStreak);
}

console.log("offline-sm2-streaks.test.ts: ok");
