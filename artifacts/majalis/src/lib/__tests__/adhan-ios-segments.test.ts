/**
 * مقاطع iOS للأذان الكامل — حد 4 مقاطع و≤28ث.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-ios-segments.test.ts
 */
import assert from "node:assert/strict";
import {
  ADHAN_IOS_MAX_SEGMENTS,
  ADHAN_IOS_MULTI_SEGMENT_BUNDLED,
  ADHAN_IOS_SEGMENT_MAX_SEC,
  ADHAN_IOS_SEGMENT_SCHEDULE_GAP_SEC,
  adhanIosSoundName,
  buildAdhanIosSegmentPlan,
  defaultAdhanSegmentDurations,
  scheduleIosFullAdhan,
} from "../adhan-ios-segments";

assert.equal(ADHAN_IOS_MAX_SEGMENTS, 4);
assert.ok(ADHAN_IOS_SEGMENT_MAX_SEC <= 28);
assert.equal(ADHAN_IOS_SEGMENT_SCHEDULE_GAP_SEC, 29);
assert.equal(ADHAN_IOS_MULTI_SEGMENT_BUNDLED, true);

assert.equal(
  adhanIosSoundName("makkah", "fajr", 1),
  "adhan-seq-makkah-01.caf",
);
assert.equal(
  adhanIosSoundName("makkah", "general", 2),
  "adhan-seq-makkah-02.caf",
);
assert.equal(
  adhanIosSoundName("egypt", "general", 1),
  "adhan-short-egypt.caf",
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
assert.ok(plan.every((p) => p.sound.startsWith("adhan-seq-makkah-")));
assert.ok(plan[0].title?.includes("الفجر"));
assert.equal(plan[1].title, null, "المقاطع التالية بلا عنوان متكرر");
assert.equal(plan[0].atMs, start);
assert.equal(plan[1].atMs, start + 29_000);
assert.equal(plan[2].atMs, start + 58_000);
assert.equal(plan[3].atMs, start + 87_000);

const overlong = buildAdhanIosSegmentPlan({
  prayerKey: "dhuhr",
  prayerName: "الظهر",
  recordingId: "egypt",
  isFajr: false,
  startAtMs: start,
  durationsSec: [40, 40],
});
assert.ok(overlong.every((p) => p.sound === "adhan-short-egypt.caf"));
assert.equal(
  overlong[1].atMs - overlong[0].atMs,
  ADHAN_IOS_SEGMENT_SCHEDULE_GAP_SEC * 1000,
);

assert.equal(defaultAdhanSegmentDurations().length, 4);

// الوضع الكامل + مكة: سلسلة ٤ مقاطع تلقائيًا
const scheduledFull = await scheduleIosFullAdhan({
  prayerKey: "isha",
  prayerName: "العشاء",
  recordingId: "makkah",
  isFajr: false,
  startAtMs: start,
  deliveryMode: "full",
});
assert.equal(scheduledFull.ok, true);
assert.equal(scheduledFull.ids.length, 4, "الوضع الكامل يفعّل السلسلة لمكة");

// الوضع المختصر: إشعار واحد
const scheduledShort = await scheduleIosFullAdhan({
  prayerKey: "isha",
  prayerName: "العشاء",
  recordingId: "makkah",
  isFajr: false,
  startAtMs: start,
  deliveryMode: "short",
});
assert.equal(scheduledShort.ok, true);
assert.equal(scheduledShort.ids.length, 1, "الوضع المختصر إشعار قصير واحد");

console.log("adhan-ios-segments.test.ts: ok");
