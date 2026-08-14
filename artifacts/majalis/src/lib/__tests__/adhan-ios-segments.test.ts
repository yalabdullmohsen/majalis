/**
 * مقاطع iOS للأذان الكامل — حد 4 مقاطع و≤28ث وفجر منفصل.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-ios-segments.test.ts
 */
import assert from "node:assert/strict";
import {
  ADHAN_IOS_MAX_SEGMENTS,
  ADHAN_IOS_MULTI_SEGMENT_BUNDLED,
  ADHAN_IOS_SEGMENT_MAX_SEC,
  adhanIosSoundName,
  buildAdhanIosSegmentPlan,
  defaultAdhanSegmentDurations,
  scheduleIosFullAdhan,
} from "../adhan-ios-segments";

assert.equal(ADHAN_IOS_MAX_SEGMENTS, 4);
assert.ok(ADHAN_IOS_SEGMENT_MAX_SEC <= 28);

assert.equal(
  adhanIosSoundName("makkah", "fajr", 1),
  "adhan_makkah_fajr_s1.caf",
);
assert.equal(
  adhanIosSoundName("makkah", "general", 2),
  "adhan_makkah_gen_s2.caf",
);

const start = Date.UTC(2026, 7, 9, 3, 0, 0);
const plan = buildAdhanIosSegmentPlan({
  prayerKey: "fajr",
  prayerName: "الفجر",
  recordingId: "makkah",
  isFajr: true,
  startAtMs: start,
  durationsSec: [28, 28, 28, 28, 28],
});

assert.equal(plan.length, 4, "حد أقصى 4 مقاطع");
assert.ok(plan.every((p) => p.sound.includes("_fajr_")), "الفجر يستخدم مقاطع التثويب");
assert.ok(plan[0].title?.includes("الفجر"));
assert.equal(plan[1].title, null, "المقاطع التالية بلا عنوان متكرر");
assert.equal(plan[0].atMs, start);
assert.equal(plan[1].atMs, start + 28_000);
assert.equal(plan[2].atMs, start + 56_000);
assert.equal(plan[3].atMs, start + 84_000);

const overlong = buildAdhanIosSegmentPlan({
  prayerKey: "dhuhr",
  prayerName: "الظهر",
  recordingId: "egypt",
  isFajr: false,
  startAtMs: start,
  durationsSec: [40, 40],
});
assert.ok(overlong.every((p) => p.sound.includes("_gen_")));
// المدد المقطوعة تُستخدم للفجوات حتى لو طُلب 40ث
assert.equal(overlong[1].atMs - overlong[0].atMs, ADHAN_IOS_SEGMENT_MAX_SEC * 1000);

assert.equal(defaultAdhanSegmentDurations().length, 4);

const scheduled = await scheduleIosFullAdhan({
  prayerKey: "isha",
  prayerName: "العشاء",
  recordingId: "madinah",
  isFajr: false,
  startAtMs: start,
});
assert.equal(scheduled.ok, true);
if (ADHAN_IOS_MULTI_SEGMENT_BUNDLED) {
  assert.equal(scheduled.ids.length, 4);
} else {
  // بدون مقاطع مرخّصة: إشعار واحد بصوت قصير مضمّن
  assert.equal(scheduled.ids.length, 1);
}

console.log("adhan-ios-segments.test.ts: ok");
