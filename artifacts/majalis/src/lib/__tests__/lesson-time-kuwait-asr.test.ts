/**
 * وقت الدرس: يوم+وقت+Asia/Kuwait؛ بعد العصر ≠ فجر؛ بلا «بعد ساعة» لنص صلاة نسبي.
 */
import assert from "node:assert/strict";
import {
  computeNextOccurrenceMs,
  formatRelativeTimeDetailed,
  formatShortLessonTime,
  isPrayerRelativeTime,
  parseTimeToMinutes,
  setPrayerTimesCache,
} from "../lesson-time";
import {
  filterKuwaitOnlyForDisplay,
  isOutsideKuwaitLesson,
  matchOutsideKuwaitSheikh,
} from "../lesson-kuwait-scope";
import type { KuwaitLessonRecord } from "../kuwait-lessons";

console.log("\n=== lesson time kuwait asr + scope ===");

assert.equal(isPrayerRelativeTime("بعد العصر"), true);
assert.equal(isPrayerRelativeTime("بعد صلاة العصر"), true);
assert.equal(isPrayerRelativeTime("16:25"), false);
assert.equal(isPrayerRelativeTime("4:30 م"), false);

assert.equal(formatShortLessonTime("بعد العصر"), "بعد العصر");
assert.equal(formatShortLessonTime("بعد صلاة العصر"), "بعد العصر");
assert.equal(formatShortLessonTime("بعد الفجر"), "بعد الفجر");

setPrayerTimesCache({
  الفجر: 4 * 60 + 15,
  الشروق: 5 * 60 + 35,
  الظهر: 12 * 60,
  العصر: 16 * 60 + 25,
  المغرب: 18 * 60 + 50,
  العشاء: 20 * 60 + 10,
});

const asrMin = parseTimeToMinutes("بعد العصر");
const fajrMin = parseTimeToMinutes("بعد الفجر");
assert.ok(asrMin != null && fajrMin != null, "أوقات الصلاة تُحلّل");
assert.ok(asrMin! > 15 * 60, `بعد العصر بعد الظهر (got ${asrMin})`);
assert.ok(asrMin! < 18 * 60, `بعد العصر قبل المغرب (got ${asrMin})`);
assert.ok(fajrMin! < 6 * 60, `بعد الفجر صباحاً (got ${fajrMin})`);
assert.notEqual(asrMin, fajrMin, "العصر لا يساوي الفجر");

const morning = new Date("2026-09-03T03:10:00+03:00"); // خميس
const nextAsr = computeNextOccurrenceMs("الخميس", "بعد العصر", morning);
const label = formatRelativeTimeDetailed(nextAsr, "بعد العصر", morning.getTime());
assert.equal(label, "بعد العصر", `التسمية الأصلية لا العدّ التنازلي المخترع (got ${label})`);
assert.ok(!/فجر/u.test(label), "لا يظهر فجراً لدرس بعد العصر");
assert.ok(!/ساعة/u.test(label), "لا «بعد ساعة» بلا timestamp مؤكد");

const confirmed = formatRelativeTimeDetailed(
  morning.getTime() + 60 * 60_000,
  "بعد العصر",
  morning.getTime(),
  { confirmedAbsolute: true },
);
assert.ok(/ساعة/u.test(confirmed), "مع timestamp مؤكد يُسمح بعد ساعة");

assert.equal(matchOutsideKuwaitSheikh("الشيخ عبد الرزاق البدر"), true);
assert.equal(matchOutsideKuwaitSheikh("عثمان الخميس"), false);

const outside: KuwaitLessonRecord = {
  id: "x-badr",
  title: "شرح الواسطية",
  sheikhName: "عبد الرزاق البدر",
  governorate: "",
  region: "العدلية",
  mosque: "معهد إعداد الدعاة",
  day: "الخميس",
  time: "بعد المغرب",
  category: "عقيدة",
  sortKey: 0,
  nextOccurrenceMs: 0,
  activityType: "دورة",
};
assert.equal(isOutsideKuwaitLesson(outside), true);
assert.equal(filterKuwaitOnlyForDisplay([outside]).length, 0);

const local: KuwaitLessonRecord = {
  ...outside,
  id: "kw-local",
  sheikhName: "سالم الطويل",
  mosque: "مسجد عمر بن الخطاب",
  region: "الرميثية",
  governorate: "حولي",
};
assert.equal(filterKuwaitOnlyForDisplay([outside, local]).map((l) => l.id).join(), "kw-local");

const placeOnly: KuwaitLessonRecord = {
  ...local,
  id: "outside-place",
  sheikhName: "محاضر محلي",
  mosque: "مسجد قباء",
  region: "المدينة المنورة",
  governorate: "",
};
assert.equal(isOutsideKuwaitLesson(placeOnly), true, "مكان سعودي بلا شيخ مستبعد");
assert.equal(filterKuwaitOnlyForDisplay([outside, local, placeOnly]).map((l) => l.id).join(), "kw-local");

console.log("  ✓ lesson time kuwait asr + scope");
