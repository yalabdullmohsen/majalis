/**
 * مقاطع iOS — إشعار قصير واحد فقط (السلاسل محذوفة).
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
  scheduleIosAdhanSegments,
  cancelAdhanIosSegmentChain,
  scheduleAdhanIosSegmentChain,
  recordingSupportsIosChainedSegments,
} from "../adhan-ios-segments";

assert.equal(ADHAN_IOS_MAX_SEGMENTS, 1);
assert.ok(ADHAN_IOS_SEGMENT_MAX_SEC <= 28);
assert.equal(ADHAN_IOS_SEGMENT_SCHEDULE_GAP_SEC, 29);
assert.equal(ADHAN_IOS_MULTI_SEGMENT_BUNDLED, false);
assert.equal(recordingSupportsIosChainedSegments("makkah"), false);

assert.match(adhanIosSoundName("makkah", "fajr", 1), /adhan-short-makkah\.caf/);
assert.match(adhanIosSoundName("egypt", "general", 1), /adhan-short-egypt\.caf/);

const start = Date.UTC(2026, 7, 9, 3, 0, 0);
const plan = buildAdhanIosSegmentPlan({
  prayerKey: "fajr",
  prayerName: "الفجر",
  recordingId: "makkah",
  isFajr: true,
  startAtMs: start,
  durationsSec: [28, 28, 28, 28, 28],
});

assert.equal(plan.length, 1, "مقطع قصير واحد فقط");
assert.ok(plan[0].sound.includes("short"));
assert.ok(plan[0].title?.includes("الفجر"));
assert.equal(plan[0].atMs, start);

assert.equal(defaultAdhanSegmentDurations().length, 1);

{
  const fajrPlan = buildAdhanIosSegmentPlan({
    prayerKey: "fajr",
    prayerName: "الفجر",
    recordingId: "makkah",
    isFajr: true,
    startAtMs: start,
    durationsSec: [28, 28, 28, 28],
  });
  const maghribPlan = buildAdhanIosSegmentPlan({
    prayerKey: "maghrib",
    prayerName: "المغرب",
    recordingId: "makkah",
    isFajr: false,
    startAtMs: start + 3600_000,
    durationsSec: [28, 28, 28, 28],
  });
  await scheduleAdhanIosSegmentChain(fajrPlan);
  await scheduleAdhanIosSegmentChain(maghribPlan);
  const onlyFajr = await cancelAdhanIosSegmentChain("fajr");
  assert.equal(onlyFajr.length, 1, "إلغاء الفجر لا يمسح المغرب");
  const leftover = await cancelAdhanIosSegmentChain();
  assert.equal(leftover.length, 1, "سلسلة المغرب بقيت");
}

// حتى deliveryMode=full → إشعار قصير واحد
const scheduledFull = await scheduleIosFullAdhan({
  prayerKey: "isha",
  prayerName: "العشاء",
  recordingId: "makkah",
  isFajr: false,
  startAtMs: start,
  deliveryMode: "full",
});
assert.equal(scheduledFull.ok, true);
assert.equal(scheduledFull.ids.length, 1, "full يُرحَّل إلى short");

const scheduledShort = await scheduleIosAdhanSegments({
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
