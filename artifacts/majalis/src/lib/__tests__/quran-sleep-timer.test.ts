/**
 * Run: npx tsx src/lib/__tests__/quran-sleep-timer.test.ts
 */
import assert from "node:assert/strict";
import {
  createSleepTimerState,
  markSleepTimerFired,
  shouldStopAfterAyahEnd,
  sleepTimerLabelAr,
} from "../quran-sleep-timer";

const off = createSleepTimerState("off");
assert.equal(shouldStopAfterAyahEnd(off, 7, 7), false);

const endSurah = createSleepTimerState("end_of_surah");
assert.equal(shouldStopAfterAyahEnd(endSurah, 3, 7), false);
assert.equal(shouldStopAfterAyahEnd(endSurah, 7, 7), true);

const timed = createSleepTimerState(15, 1_000_000);
assert.equal(timed.deadlineMs, 1_000_000 + 15 * 60_000);
assert.equal(shouldStopAfterAyahEnd(timed, 1, 7), false);
const fired = markSleepTimerFired(timed);
assert.equal(fired.stopAfterCurrent, true);
assert.equal(shouldStopAfterAyahEnd(fired, 1, 7), true);

assert.ok(sleepTimerLabelAr(30).includes("٣٠") || sleepTimerLabelAr(30).includes("30"));
assert.equal(sleepTimerLabelAr("end_of_surah"), "نهاية السورة");

console.log("quran-sleep-timer: ok");
