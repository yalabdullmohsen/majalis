/**
 * إلغاء ذكي لسلسلة الأذان — حدود واستئناف.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-smart-cancel.test.ts
 */
import assert from "node:assert/strict";
import {
  adhanSmartCancelMaxSegments,
  cancelAdhanNotificationChain,
  clearAdhanResumeContext,
  getAdhanResumeContext,
  onAdhanSegmentNotificationInteraction,
  rememberAdhanResumeContext,
} from "../adhan-smart-cancel";
import {
  buildAdhanIosSegmentPlan,
  scheduleAdhanIosSegmentChain,
  cancelAdhanIosSegmentChain,
} from "../adhan-ios-segments";

assert.equal(adhanSmartCancelMaxSegments(), 4);

clearAdhanResumeContext();
rememberAdhanResumeContext({
  prayerKey: "maghrib",
  muezzinId: "makkah",
  isFajr: false,
});
const ctx = getAdhanResumeContext();
assert.ok(ctx);
assert.equal(ctx?.prayerKey, "maghrib");
assert.equal(ctx?.muezzinId, "makkah");

const start = Date.UTC(2026, 7, 9, 18, 0, 0);
const plan = buildAdhanIosSegmentPlan({
  prayerKey: "maghrib",
  prayerName: "المغرب",
  recordingId: "makkah",
  isFajr: false,
  startAtMs: start,
  durationsSec: [28, 28, 28, 28],
});
assert.equal(plan.length, 4);
await scheduleAdhanIosSegmentChain(plan);

const cancelled = await cancelAdhanNotificationChain({ resumeInternal: false });
assert.equal(cancelled.cancelledIds.length, 4);
assert.equal(cancelled.resumed, false);

// بعد الإلغاء لا تبقى سلسلة
const again = await cancelAdhanIosSegmentChain();
assert.equal(again.length, 0);

// تفاعل إشعار مقطع (في Node لا يوجد Audio — الاستئناف يُلغى بأمان)
rememberAdhanResumeContext({
  prayerKey: "isha",
  muezzinId: "madinah",
  isFajr: false,
});
const handled = await onAdhanSegmentNotificationInteraction({
  adhanSegment: true,
  prayerKey: "isha",
  segmentIndex: 1,
});
assert.equal(handled, true);
assert.equal(getAdhanResumeContext(), null, "يُمسح سياق الاستئناف بعد التفاعل");

const ignored = await onAdhanSegmentNotificationInteraction({ foo: 1 });
assert.equal(ignored, false);

console.log("adhan-smart-cancel.test.ts: ok");
