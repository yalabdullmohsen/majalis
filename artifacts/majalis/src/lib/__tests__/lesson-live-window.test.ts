/**
 * نافذة «جارٍ الآن» — ساعتان افتراضيًا، أو حتى وقت الانتهاء الصريح.
 * لا تقفز nextOccurrence إلى +٧ أيام أثناء الحصة.
 */
import assert from "node:assert/strict";
import {
  computeNextOccurrenceMs,
  getKuwaitClock,
  isLessonInProgress,
  LESSON_DURATION_MIN,
  resolveLessonTimeWindow,
} from "../lesson-time";

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;

function kuwaitNowParts(d: Date) {
  return getKuwaitClock(d);
}

console.log("\n=== lesson live window ===");

assert.equal(LESSON_DURATION_MIN, 120, "المدة الافتراضية ساعتان");

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
  // ما زال داخل ساعتين (١٠٥ دقيقة مضت)
  const startMin = Math.max(0, clock.hour * 60 + clock.minute - 105);
  if (clock.hour * 60 + clock.minute >= 105) {
    const hh = String(Math.floor(startMin / 60)).padStart(2, "0");
    const mm = String(startMin % 60).padStart(2, "0");
    const time = `${hh}:${mm}`;
    assert.equal(isLessonInProgress(dayName, time, now), true, "بعد ١٠٥ دقائق ما زال جاريًا ضمن ساعتين");
    const nextMs = computeNextOccurrenceMs(dayName, time, now);
    const diffDays = (nextMs - now.getTime()) / (24 * 60 * 60_000);
    assert.ok(diffDays < 1, "لا قفز للأسبوع أثناء الساعة الثانية من الحصة");
  } else {
    console.log("  skip: too early for 105-min in-window assert");
  }
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

{
  const win = resolveLessonTimeWindow("4:00 م - 6:00 م");
  assert.ok(win, "مدى صريح يُحلل");
  assert.equal(win!.startMin, 16 * 60, "بدء 4 م");
  assert.equal(win!.endMin, 18 * 60, "انتهاء 6 م");
  assert.equal(win!.hasExplicitEnd, true, "انتهاء صريح");

  const defaultWin = resolveLessonTimeWindow("4:00 م");
  assert.ok(defaultWin);
  assert.equal(defaultWin!.endMin, defaultWin!.startMin + 120, "بدون مدى → +ساعتين");
  assert.equal(defaultWin!.hasExplicitEnd, false);
}

{
  // وقت ثابت: أربعاء 2026-07-01 17:30 KWT — درس 16:00–18:00 جارٍ
  const during = new Date("2026-07-01T17:30:00+03:00");
  assert.equal(isLessonInProgress("الأربعاء", "4:00 م - 6:00 م", during), true, "ضمن المدى الصريح جارٍ");
  const after = new Date("2026-07-01T18:05:00+03:00");
  assert.equal(isLessonInProgress("الأربعاء", "4:00 م - 6:00 م", after), false, "بعد المدى الصريح انتهى");
  const nextMs = computeNextOccurrenceMs("الأربعاء", "4:00 م - 6:00 م", after);
  const diffDays = (nextMs - after.getTime()) / (24 * 60 * 60_000);
  assert.ok(diffDays > 5, "بعد المدى الصريح يقفز للأسبوع القادم");
}

{
  const now = new Date();
  assert.equal(isLessonInProgress("", "4:00 م", now), false, "بلا يوم → لا جارٍ الآن");
  assert.equal(isLessonInProgress("الأربعاء", "", now), false, "بلا وقت → لا جارٍ الآن");
  assert.equal(isLessonInProgress("يوم غير معروف", "4:00 م", now), false, "يوم غير قابل للتحليل → لا جارٍ الآن");
  assert.equal(isLessonInProgress("الأربعاء", "وقت غير مفهوم", now), false, "وقت غير قابل للتحليل → لا جارٍ الآن");
}

console.log("  ✓ lesson live window");
