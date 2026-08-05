/**
 * نافذة «جارٍ الآن» — لا تقفز nextOccurrence إلى +٧ أيام أثناء الحصة.
 */
import assert from "node:assert/strict";
import {
  computeNextOccurrenceMs,
  getKuwaitClock,
  isLessonInProgress,
  LESSON_DURATION_MIN,
} from "../lesson-time";

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;

function kuwaitNowParts(d: Date) {
  return getKuwaitClock(d);
}

console.log("\n=== lesson live window ===");

{
  const now = new Date();
  const clock = kuwaitNowParts(now);
  const dayName = DAY_NAMES[clock.weekday];
  const startMin = Math.max(0, clock.hour * 60 + clock.minute - 30);
  const hh = String(Math.floor(startMin / 60)).padStart(2, "0");
  const mm = String(startMin % 60).padStart(2, "0");
  const time = `${hh}:${mm}`;

  assert.equal(isLessonInProgress(dayName, time, now), true, "درس بدأ قبل ٣٠ دقيقة ما زال جاريًا");

  const nextMs = computeNextOccurrenceMs(dayName, time, now);
  const diffDays = (nextMs - now.getTime()) / (24 * 60 * 60_000);
  assert.ok(
    diffDays < 1,
    `nextOccurrence أثناء الحصة يجب أن يبقى اليوم (diffDays=${diffDays.toFixed(2)}) لا ≈٧`,
  );
}

{
  const now = new Date();
  const clock = kuwaitNowParts(now);
  const dayName = DAY_NAMES[clock.weekday];
  const startMin = Math.max(0, clock.hour * 60 + clock.minute - (LESSON_DURATION_MIN + 5));
  const hh = String(Math.floor(startMin / 60)).padStart(2, "0");
  const mm = String(startMin % 60).padStart(2, "0");
  const time = `${hh}:${mm}`;

  if (startMin === 0 && clock.hour * 60 + clock.minute < LESSON_DURATION_MIN + 5) {
    console.log("  skip: too early in day to assert post-window jump");
  } else {
    assert.equal(isLessonInProgress(dayName, time, now), false, "بعد انتهاء النافذة ليس جاريًا");
    const nextMs = computeNextOccurrenceMs(dayName, time, now);
    const diffDays = (nextMs - now.getTime()) / (24 * 60 * 60_000);
    assert.ok(diffDays > 5, `بعد انتهاء الحصة يقفز للأسبوع القادم (diffDays=${diffDays.toFixed(2)})`);
  }
}

console.log("  ✓ lesson live window");
