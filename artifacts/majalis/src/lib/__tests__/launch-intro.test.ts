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
  LAUNCH_READY_CAP_MS,
  LAUNCH_TAGLINES,
  canDismissLaunch,
  pickLaunchTagline,
} from "../launch-intro.js";

assert.equal(LAUNCH_ENTER_MS, 350);
assert.equal(LAUNCH_EXIT_MS, 250);
assert.equal(LAUNCH_READY_CAP_MS, 1_200);
assert.equal(LAUNCH_MAX_MS, 3_000);
assert.equal(LAUNCH_INTRO_MIN_MS, LAUNCH_ENTER_MS);
assert.equal(LAUNCH_INTRO_MAX_MS, LAUNCH_MAX_MS);
assert.equal(LAUNCH_INTRO_FADE_MS, LAUNCH_EXIT_MS);

assert.ok(LAUNCH_MAX_MS <= 3_000, "سقف ≤3s");
assert.ok(LAUNCH_READY_CAP_MS <= 1_200, "سقف الجاهزية ≤1.2s");
assert.ok(LAUNCH_ENTER_MS < LAUNCH_READY_CAP_MS);

assert.equal(canDismissLaunch({ ready: false, elapsedMs: 500 }), false);
assert.equal(canDismissLaunch({ ready: true, elapsedMs: 200 }), false);
assert.equal(canDismissLaunch({ ready: true, elapsedMs: 350 }), true);
assert.equal(canDismissLaunch({ ready: true, elapsedMs: 1_200 }), true);
assert.equal(canDismissLaunch({ ready: false, elapsedMs: 3_000 }), true);
assert.equal(canDismissLaunch({ ready: false, elapsedMs: 2_999 }), false);

assert.ok(LAUNCH_TAGLINES.length >= 2);
assert.ok(LAUNCH_TAGLINES.includes("علمٌ نافع وتجربة هادئة"));
assert.ok(LAUNCH_TAGLINES.includes("بوابتك للعلم والعبادة"));
assert.ok(typeof pickLaunchTagline(0) === "string");
assert.ok(typeof pickLaunchTagline(1) === "string");

console.log("launch-intro.test.ts: ok");
