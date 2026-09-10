/**
 * اختبارات مصالحة جدولة إشعارات الصلاة.
 * Run: node --import tsx src/lib/__tests__/prayer-notification-scheduler.test.ts
 */
import assert from "node:assert/strict";
import {
  buildDesiredPrayerNotification,
  classifyPrayerScheduleHealth,
  computeSafeScheduleDayWindow,
  planPrayerNotificationReconcile,
  validateDesiredAgainstPending,
  type DesiredPrayerNotification,
  type PendingPrayerNotification,
} from "../prayer-notification-scheduler";
import {
  hashPrayerNotificationId,
  logicalPrayerNotificationId,
  parseLogicalPrayerNotificationId,
} from "../prayer-notification-ids";

const TZ = "Asia/Kuwait";
const now = Date.parse("2026-09-10T08:00:00+03:00");

function desired(
  prayerId: string,
  date: string,
  kind: "pre" | "enter" | "post" | "iqamah",
  fireAtMs: number,
  preMinutes?: number,
): DesiredPrayerNotification {
  const d = buildDesiredPrayerNotification({
    prayerId,
    localDate: date,
    kind,
    fireAtMs,
    timeZone: TZ,
    title: prayerId,
    body: kind,
    soundId: "default",
    preMinutes,
    scheduleVersion: "v1",
    settingsVersion: "v1",
    nowMs: now,
  });
  assert.ok(d, `desired should build for ${prayerId}/${kind}`);
  return d!;
}

{
  const id = logicalPrayerNotificationId("fajr", "2026-09-11", "enter");
  assert.equal(id, "prayer.fajr.2026-09-11.entry");
  const pre = logicalPrayerNotificationId("fajr", "2026-09-11", "pre", 10);
  assert.equal(pre, "prayer.fajr.2026-09-11.pre.10");
  const parsed = parseLogicalPrayerNotificationId(pre);
  assert.ok(parsed);
  assert.equal(parsed!.prayerId, "fajr");
  assert.equal(
    hashPrayerNotificationId("fajr", "2026-09-11", "enter"),
    hashPrayerNotificationId("fajr", "2026-09-11", "enter"),
  );
  console.log("  ✓ logical identifiers stable");
}

{
  const d1 = desired("fajr", "2026-09-11", "enter", now + 3600_000);
  const d2 = desired("dhuhr", "2026-09-11", "enter", now + 7200_000);
  const pending: PendingPrayerNotification[] = [
    {
      id: d1.id,
      logicalId: d1.logicalId,
      fireAtMs: d1.fireAtMs,
      soundId: "default",
      kind: "prayer-enter",
      prayerId: "fajr",
    },
    {
      id: 999001,
      logicalId: "lesson.new.1",
      fireAtMs: now + 999_000,
      soundId: null,
      kind: "lesson",
      prayerId: null,
    },
  ];
  const plan = planPrayerNotificationReconcile([d1, d2], pending, now);
  assert.equal(plan.correct.length, 1);
  assert.equal(plan.missing.length, 1);
  assert.equal(plan.missing[0]!.prayerId, "dhuhr");
  assert.equal(plan.foreign.length, 1);
  assert.ok(!plan.cancelIds.includes(999001));
  console.log("  ✓ reconcile keeps foreign, adds missing");
}

{
  const d = desired("asr", "2026-09-11", "enter", now + 5000_000);
  const stale: PendingPrayerNotification = {
    id: 424242,
    logicalId: "prayer.asr.2026-09-10.entry",
    fireAtMs: now + 1000_000,
    soundId: "default",
    kind: "prayer-enter",
    prayerId: "asr",
  };
  const plan = planPrayerNotificationReconcile([d], [stale], now);
  assert.equal(plan.stale.length, 1);
  assert.ok(plan.cancelIds.includes(424242));
  assert.equal(plan.scheduleItems.length, 1);
  console.log("  ✓ stale cancelled");
}

{
  const d = desired("maghrib", "2026-09-11", "enter", now + 8000_000);
  const changedPending: PendingPrayerNotification = {
    id: d.id,
    logicalId: d.logicalId,
    fireAtMs: d.fireAtMs + 5 * 60_000,
    soundId: "default",
    kind: "prayer-enter",
    prayerId: "maghrib",
  };
  const plan = planPrayerNotificationReconcile([d], [changedPending], now);
  assert.equal(plan.changed.length, 1);
  assert.ok(plan.cancelIds.includes(d.id));
  console.log("  ✓ changed replaced");
}

{
  const d = desired("isha", "2026-09-11", "enter", now + 9000_000);
  const past: PendingPrayerNotification = {
    id: 7,
    logicalId: "prayer.isha.2026-09-10.entry",
    fireAtMs: now - 60_000,
    soundId: null,
    kind: "prayer-enter",
    prayerId: "isha",
  };
  const plan = planPrayerNotificationReconcile([d], [past], now);
  assert.equal(plan.expired.length, 1);
  console.log("  ✓ past expired");
}

{
  const d1 = desired("fajr", "2026-09-11", "enter", now + 3600_000);
  const pending: PendingPrayerNotification[] = [
    {
      id: d1.id,
      logicalId: d1.logicalId,
      fireAtMs: d1.fireAtMs,
      soundId: "default",
      kind: "prayer-enter",
      prayerId: "fajr",
    },
  ];
  const plan1 = planPrayerNotificationReconcile([d1], pending, now);
  const plan2 = planPrayerNotificationReconcile([d1], pending, now);
  assert.equal(plan1.scheduleItems.length, 0);
  assert.equal(plan2.scheduleItems.length, 0);
  const v = validateDesiredAgainstPending([d1], pending, now);
  assert.equal(v.ok, true);
  assert.equal(v.verifiedCount, 1);
  console.log("  ✓ idempotent + validate");
}

{
  assert.equal(
    buildDesiredPrayerNotification({
      prayerId: "fajr",
      localDate: "2026-09-10",
      kind: "enter",
      fireAtMs: now - 1000,
      timeZone: TZ,
      title: "x",
      body: "y",
      soundId: "default",
      scheduleVersion: "v1",
      settingsVersion: "v1",
      nowMs: now,
    }),
    null,
  );
  console.log("  ✓ past desired rejected");
}

{
  const w = computeSafeScheduleDayWindow({
    enabledPrayers: 5,
    kindsPerPrayer: 3,
    reservedOther: 10,
    platformCap: 64,
  });
  assert.ok(w.days >= 2 && w.days <= 14);
  console.log("  ✓ safe window", w);
}

{
  assert.equal(
    classifyPrayerScheduleHealth({
      permission: "granted",
      hasLocation: true,
      validationOk: true,
      desiredCount: 2,
      verifiedCount: 2,
      nextAtMs: now + 1000,
      nowMs: now,
    }).code,
    "healthy",
  );
  assert.equal(
    classifyPrayerScheduleHealth({ permission: "denied", hasLocation: true }).code,
    "permissionDenied",
  );
  console.log("  ✓ health");
}

console.log("prayer-notification-scheduler.test.ts: ok");
