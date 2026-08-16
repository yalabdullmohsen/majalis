/**
 * بوابة جاهزية الإقلاع — بلا شبكة.
 * node --import tsx src/lib/__tests__/launch-readiness.test.ts
 */
import assert from "node:assert/strict";
import {
  __resetLaunchReadinessForTests,
  bootstrapLaunchReadinessSync,
  isAppLaunchReady,
  isLaunchGateReady,
  markLaunchGate,
  subscribeLaunchReady,
} from "../launch-readiness.js";

__resetLaunchReadinessForTests();
assert.equal(isAppLaunchReady(), false);

bootstrapLaunchReadinessSync();
assert.equal(isLaunchGateReady("theme"), true);
assert.equal(isLaunchGateReady("auth"), true);
assert.equal(isLaunchGateReady("prayerCache"), true);
assert.equal(isLaunchGateReady("shell"), false);
assert.equal(isAppLaunchReady(), false);

let called = 0;
const unsub = subscribeLaunchReady(() => {
  called += 1;
});
markLaunchGate("shell");
assert.equal(isAppLaunchReady(), true);
assert.ok(called >= 1);
unsub();

__resetLaunchReadinessForTests();
assert.equal(isAppLaunchReady(), false);

console.log("launch-readiness.test.ts: ok");
