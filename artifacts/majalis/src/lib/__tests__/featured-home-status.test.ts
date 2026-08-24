/**
 * تسميات العدّ التنازلي في الرئيسية والأقسام المميزة — بلا «قادم».
 * التشغيل: npx tsx src/lib/__tests__/featured-home-status.test.ts
 */
import assert from "node:assert/strict";
import {
  filterFeaturedHomeLessons,
  getFeaturedHomeStatusLabel,
  isFeaturedHomeStatusLabel,
  mapLessonRow,
  type KuwaitLessonRecord,
} from "../kuwait-lessons";

console.log("\n=== featured home countdown labels ===");

assert.equal(isFeaturedHomeStatusLabel("مستمر"), true);
assert.equal(isFeaturedHomeStatusLabel("بعد يوم"), true);
assert.equal(isFeaturedHomeStatusLabel("بعد ساعتين"), true);
assert.equal(isFeaturedHomeStatusLabel("قادم"), false);
assert.equal(isFeaturedHomeStatusLabel("انتهى اليوم"), false);
assert.equal(isFeaturedHomeStatusLabel("منتهٍ"), false);

const baseRow = {
  id: "feat-test-1",
  title: "درس تجريبي",
  speaker_name: "الشيخ: أحمد",
  governorate: "العاصمة",
  region: "الدسمة",
  mosque: "مسجد النور",
  day_of_week: "الجمعة",
  lesson_time: "8:00 م",
  category: "فقه",
  is_recurring: true,
  source: "seed",
} as const;

const activeLesson = mapLessonRow(baseRow) as KuwaitLessonRecord;
const wednesdayNoon = new Date("2026-08-05T12:00:00+03:00").getTime();
const labelFar = getFeaturedHomeStatusLabel(activeLesson, wednesdayNoon);
assert.ok(labelFar?.startsWith("بعد"), `expected countdown, got ${labelFar}`);
assert.notEqual(labelFar, "قادم");

const fridayMorning = new Date("2026-08-07T10:00:00+03:00").getTime();
const labelToday = getFeaturedHomeStatusLabel(activeLesson, fridayMorning);
assert.ok(labelToday?.startsWith("بعد") || labelToday === "الآن", `got ${labelToday}`);

const expiredLesson = mapLessonRow({
  ...baseRow,
  id: "feat-test-expired",
  end_date: "2026-07-01",
  is_recurring: false,
}) as KuwaitLessonRecord;
const afterEnd = new Date("2026-08-07T12:00:00+03:00").getTime();
assert.equal(getFeaturedHomeStatusLabel(expiredLesson, afterEnd), null);

const mixed = [activeLesson, expiredLesson];
const filtered = filterFeaturedHomeLessons(mixed, afterEnd);
assert.equal(filtered.length, 1);
assert.equal(filtered[0]?.id, activeLesson.id);

console.log("featured-home-status.test.ts: ok");
