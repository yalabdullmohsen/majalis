/**
 * منطق شاشة التشغيل اليومية — توقيتات + فصل عن Onboarding.
 * node --import tsx src/lib/__tests__/launch-intro.test.ts
 */
import assert from "node:assert/strict";
import {
  LAUNCH_ENTER_MS,
  LAUNCH_EXIT_MS,
  LAUNCH_INTRO_FADE_MS,
  LAUNCH_INTRO_MAX_MS,
  LAUNCH_INTRO_MIN_MS,
  LAUNCH_MAX_MS,
  LAUNCH_MIN_MS,
  LAUNCH_READY_CAP_MS,
  LAUNCH_TAGLINE,
  LAUNCH_TAGLINES,
  LAUNCH_TARGET_MS,
  canDismissLaunch,
  pickLaunchTagline,
} from "../launch-intro.js";

assert.equal(LAUNCH_ENTER_MS, 420);
assert.equal(LAUNCH_EXIT_MS, 280);
assert.equal(LAUNCH_MIN_MS, 1_200);
assert.equal(LAUNCH_TARGET_MS, 1_500);
assert.equal(LAUNCH_MAX_MS, 1_800);
assert.equal(LAUNCH_READY_CAP_MS, LAUNCH_TARGET_MS);
assert.equal(LAUNCH_INTRO_MIN_MS, LAUNCH_ENTER_MS);
assert.equal(LAUNCH_INTRO_MAX_MS, LAUNCH_MAX_MS);
assert.equal(LAUNCH_INTRO_FADE_MS, LAUNCH_EXIT_MS);

assert.ok(LAUNCH_MAX_MS <= 1_800, "سقف ≤1.8s");
assert.ok(LAUNCH_MIN_MS >= 1_200, "حد أدنى ≥1.2s");
assert.ok(LAUNCH_ENTER_MS < LAUNCH_MIN_MS);
assert.ok(LAUNCH_TARGET_MS >= LAUNCH_MIN_MS && LAUNCH_TARGET_MS <= LAUNCH_MAX_MS);

assert.equal(canDismissLaunch({ ready: false, elapsedMs: 500 }), false);
assert.equal(canDismissLaunch({ ready: true, elapsedMs: 500 }), false);
assert.equal(canDismissLaunch({ ready: true, elapsedMs: 1_200 }), true);
assert.equal(canDismissLaunch({ ready: false, elapsedMs: 1_500 }), true);
assert.equal(canDismissLaunch({ ready: false, elapsedMs: 1_800 }), true);
assert.equal(canDismissLaunch({ ready: false, elapsedMs: 1_499 }), false);
assert.equal(canDismissLaunch({ ready: false, elapsedMs: 100, skipped: true }), true);

assert.equal(LAUNCH_TAGLINE, "منصة علمية شرعية موثوقة");
assert.ok(LAUNCH_TAGLINES.includes(LAUNCH_TAGLINE));
assert.equal(pickLaunchTagline(0), LAUNCH_TAGLINE);
assert.equal(pickLaunchTagline(1), LAUNCH_TAGLINE);

console.log("launch-intro.test.ts: ok");
