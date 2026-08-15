/**
 * منطق جلسة الدخولية — مرة واحدة لكل جلسة متصفح/WebView.
 * node --import tsx src/lib/__tests__/launch-intro.test.ts
 */
import assert from "node:assert/strict";
import {
  LAUNCH_INTRO_MAX_MS,
  LAUNCH_INTRO_MIN_MS,
  __resetLaunchIntroForTests,
  hasSeenLaunchIntroThisSession,
  markLaunchIntroSeen,
  shouldShowLaunchIntro,
} from "../launch-intro.js";

__resetLaunchIntroForTests();

assert.equal(LAUNCH_INTRO_MIN_MS, 900);
assert.equal(LAUNCH_INTRO_MAX_MS, 1400);
assert.ok(LAUNCH_INTRO_MAX_MS <= 1500, "سقف ≤1.5s");
assert.ok(LAUNCH_INTRO_MIN_MS >= 900 && LAUNCH_INTRO_MIN_MS <= LAUNCH_INTRO_MAX_MS);

assert.equal(shouldShowLaunchIntro(), true);
assert.equal(hasSeenLaunchIntroThisSession(), false);

markLaunchIntroSeen();
assert.equal(shouldShowLaunchIntro(), false);
assert.equal(hasSeenLaunchIntroThisSession(), true);

__resetLaunchIntroForTests();
assert.equal(shouldShowLaunchIntro(), true);

console.log("launch-intro.test.ts: ok");
