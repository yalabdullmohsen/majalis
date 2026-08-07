/**
 * تسميات الحالة المسموحة في الرئيسية والأقسام المميزة.
 * التشغيل: npx tsx src/lib/__tests__/featured-home-status.test.ts
 */
import assert from "node:assert/strict";
import {
  FEATURED_HOME_STATUS_LABELS,
  filterFeaturedHomeLessons,
  getFeaturedHomeStatusLabel,
  isFeaturedHomeStatusLabel,
  mapLessonRow,
  type KuwaitLessonRecord,
} from "../kuwait-lessons";

console.log("\n=== featured home status allowlist ===");

assert.deepEqual([...FEATURED_HOME_STATUS_LABELS], ["يبدأ اليوم", "مستمر", "قادم"]);

for (const label of FEATURED_HOME_STATUS_LABELS) {
  assert.equal(isFeaturedHomeStatusLabel(label), true, `${label} allowed`);
}
assert.equal(isFeaturedHomeStatusLabel("انتهى اليوم"), false);
assert.equal(isFeaturedHomeStatusLabel("منتهٍ"), false);
assert.equal(isFeaturedHomeStatusLabel("جارٍ الآن"), false);

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
const wednesdayNoon = new Date("2026-08-05T12:00:00+03:00").getTime(); // الأربعاء
assert.equal(getFeaturedHomeStatusLabel(activeLesson, wednesdayNoon), "قادم");

const fridayMorning = new Date("2026-08-07T10:00:00+03:00").getTime(); // الجمعة قبل الدرس
assert.equal(getFeaturedHomeStatusLabel(activeLesson, fridayMorning), "يبدأ اليوم");

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
