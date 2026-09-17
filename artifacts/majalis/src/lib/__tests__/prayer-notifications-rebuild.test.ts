/**
 * اختبارات طبقة تنبيهات الصلاة الموحّدة (منطق نقي — بلا جهاز).
 * Run: node --import tsx src/lib/__tests__/prayer-notifications-rebuild.test.ts
 */
import assert from "node:assert/strict";
import {
  validatePrayerDayOrder,
  providePrayerDayFromPayload,
} from "../prayer-notifications/provider";
import {
  buildDesiredEnterNotifications,
  buildEnterNotificationTitle,
  assertNoDuplicateDesiredIds,
} from "../prayer-notifications/scheduler";
import { buildScheduleFingerprint } from "../prayer-notifications/fingerprint";
import {
  defaultPrayerNotificationPreferences,
  migrateFromLegacyPreferences,
  isPrayerAlertEnabled,
  patchPrayerNotificationPreferences,
  loadPrayerNotificationPreferences,
} from "../prayer-notifications/preferences";
import {
  collectLegacyPrayerCancelIds,
  isProtectedNonPrayerId,
  LEGACY_PRAYER_FIXED_IDS,
} from "../prayer-notifications/legacy-cleanup";
import type {
  PrayerDayTimes,
  PrayerNotificationPreferences,
} from "../prayer-notifications/types";
import type { PrayerTimesPayload } from "../prayer-times";

function makeDay(overrides?: Partial<PrayerDayTimes>): PrayerDayTimes {
  const dateISO = "2026-09-15";
  return {
    timeZone: "Asia/Kuwait",
    dateISO,
    methodId: "Kuwait",
    madhabId: "Shafi",
    valid: true,
    slots: [
      { key: "fajr", nameAr: "الفجر", minutes: 300, epochMs: 1_000_000, dateISO },
      { key: "dhuhr", nameAr: "الظهر", minutes: 720, epochMs: 2_000_000, dateISO },
      { key: "asr", nameAr: "العصر", minutes: 900, epochMs: 3_000_000, dateISO },
      { key: "maghrib", nameAr: "المغرب", minutes: 1080, epochMs: 4_000_000, dateISO },
      { key: "isha", nameAr: "العشاء", minutes: 1200, epochMs: 5_000_000, dateISO },
    ],
    ...overrides,
  };
}

function enabledPrefs(
  patch?: Partial<PrayerNotificationPreferences>,
): PrayerNotificationPreferences {
  const base = defaultPrayerNotificationPreferences();
  return {
    ...base,
    masterEnabled: true,
    prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    ...patch,
  };
}

{
  assert.equal(buildEnterNotificationTitle("الفجر"), "حان وقت صلاة الفجر");
  console.log("  ✓ enter title copy");
}

{
  assert.equal(validatePrayerDayOrder(makeDay().slots).ok, true);
  const bad = makeDay({
    slots: [
      { key: "fajr", nameAr: "الفجر", minutes: 720, epochMs: 2, dateISO: "2026-09-15" },
      { key: "dhuhr", nameAr: "الظهر", minutes: 300, epochMs: 1, dateISO: "2026-09-15" },
      { key: "asr", nameAr: "العصر", minutes: 900, epochMs: 3, dateISO: "2026-09-15" },
      { key: "maghrib", nameAr: "المغرب", minutes: 1080, epochMs: 4, dateISO: "2026-09-15" },
      { key: "isha", nameAr: "العشاء", minutes: 1200, epochMs: 5, dateISO: "2026-09-15" },
    ],
  });
  assert.equal(validatePrayerDayOrder(bad.slots).ok, false);
  console.log("  ✓ prayer order validation");
}

{
  const estimated = providePrayerDayFromPayload({
    ok: true,
    city: "Kuwait",
    timezone: "Asia/Kuwait",
    method: "Kuwait",
    source: "تقديري بدون اتصال",
    date: { gregorian: "2026-09-15", hijri: null, readable: null },
    prayers: [],
    fetchedAt: new Date().toISOString(),
    stale: true,
  } as PrayerTimesPayload);
  assert.equal(estimated.valid, false);
  console.log("  ✓ estimated payload rejected");
}

{
  const desired = buildDesiredEnterNotifications([makeDay()], enabledPrefs(), 500_000);
  assert.equal(desired.length, 5);
  assert.ok(assertNoDuplicateDesiredIds(desired));
  console.log("  ✓ all enabled prayers schedule one enter each");
}

{
  const prefs = enabledPrefs({
    prayers: { fajr: true, dhuhr: false, asr: true, maghrib: true, isha: true },
  });
  const desired = buildDesiredEnterNotifications([makeDay()], prefs, 500_000);
  assert.equal(desired.some((d) => d.prayerKey === "dhuhr"), false);
  assert.equal(desired.length, 4);
  console.log("  ✓ disabled prayer not scheduled");
}

{
  const prefs = enabledPrefs();
  const day = makeDay();
  const a = buildDesiredEnterNotifications([day], prefs, 500_000);
  const b = buildDesiredEnterNotifications([day], prefs, 500_000);
  assert.deepEqual(
    a.map((x) => x.id),
    b.map((x) => x.id),
  );
  console.log("  ✓ reschedule twice is idempotent (same ids)");
}

{
  const prefs = enabledPrefs();
  const day = makeDay();
  const fp1 = buildScheduleFingerprint(day, prefs, { preMinutes: 15, enterEnabled: true });
  const fp2 = buildScheduleFingerprint(day, prefs, { preMinutes: 15, enterEnabled: true });
  assert.equal(fp1, fp2);
  const fpTz = buildScheduleFingerprint(
    { ...day, timeZone: "Asia/Riyadh" },
    prefs,
    { preMinutes: 15, enterEnabled: true },
  );
  assert.notEqual(fp1, fpTz);
  console.log("  ✓ fingerprint stable; timezone change invalidates");
}

{
  const now = 3_500_000;
  const desired = buildDesiredEnterNotifications([makeDay()], enabledPrefs(), now);
  assert.ok(desired.every((d) => d.fireAtMs > now));
  assert.equal(desired.some((d) => d.prayerKey === "fajr"), false);
  console.log("  ✓ past times not scheduled");
}

{
  const invalidDay = makeDay({
    valid: false,
    invalidReason: "missing",
    slots: [
      { key: "fajr", nameAr: "الفجر", minutes: null, epochMs: null, dateISO: "2026-09-15" },
      { key: "dhuhr", nameAr: "الظهر", minutes: null, epochMs: null, dateISO: "2026-09-15" },
      { key: "asr", nameAr: "العصر", minutes: null, epochMs: null, dateISO: "2026-09-15" },
      { key: "maghrib", nameAr: "المغرب", minutes: null, epochMs: null, dateISO: "2026-09-15" },
      { key: "isha", nameAr: "العشاء", minutes: null, epochMs: null, dateISO: "2026-09-15" },
    ],
  });
  assert.equal(buildDesiredEnterNotifications([invalidDay], enabledPrefs(), 0).length, 0);
  console.log("  ✓ invalid/missing times skip scheduling");
}

{
  const prefs = enabledPrefs({ masterEnabled: false });
  assert.equal(isPrayerAlertEnabled(prefs, "fajr"), false);
  assert.equal(buildDesiredEnterNotifications([makeDay()], prefs, 0).length, 0);
  console.log("  ✓ master off does not schedule");
}

{
  const store: Record<string, string> = {};
  const orig = globalThis.localStorage;
  // @ts-expect-error test stub
  globalThis.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
  try {
    assert.equal(migrateFromLegacyPreferences().masterEnabled, false);
    console.log("  ✓ legacy migration conservative when absent");

    // Enabling master with zero prayers must heal to all-on (device schedule path).
    const enabled = patchPrayerNotificationPreferences({ masterEnabled: true });
    assert.equal(enabled.masterEnabled, true);
    assert.equal(enabled.prayers.fajr, true);
    assert.equal(enabled.prayers.dhuhr, true);
    assert.equal(enabled.prayers.asr, true);
    assert.equal(enabled.prayers.maghrib, true);
    assert.equal(enabled.prayers.isha, true);
    assert.equal(isPrayerAlertEnabled(enabled, "fajr"), true);
    console.log("  ✓ master on with zero prayers heals to all-on");

    // Poisoned store: master on, all prayers off → load heals.
    store["majalis-prayer-notification-prefs-v1"] = JSON.stringify({
      ...defaultPrayerNotificationPreferences(),
      masterEnabled: true,
      prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    });
    const healed = loadPrayerNotificationPreferences();
    assert.equal(healed.prayers.fajr, true);
    assert.equal(healed.prayers.isha, true);
    console.log("  ✓ load heals poisoned master-on/zero-prayers store");
  } finally {
    globalThis.localStorage = orig;
  }
}

{
  assert.equal(isProtectedNonPrayerId(9301), true);
  assert.equal(isProtectedNonPrayerId(9401), true);
  assert.equal(LEGACY_PRAYER_FIXED_IDS.includes(9400 as never), false);
  const ids = collectLegacyPrayerCancelIds({
    timeZone: "Asia/Kuwait",
    nowMs: Date.parse("2026-09-15T12:00:00+03:00"),
    pending: [
      { id: 9301, extra: { kind: "quran-daily" } },
      { id: 9401, extra: { kind: "dhikr" } },
      { id: 999001, extra: { kind: "lesson" } },
      {
        id: 200_123,
        extra: { kind: "prayer-enter", prayerKey: "fajr", friendlyKey: "adhan-fajr-2026-09-15" },
      },
    ],
  });
  const idSet = new Set(ids.map((x) => x.id));
  assert.equal(idSet.has(9301), false);
  assert.equal(idSet.has(9401), false);
  assert.equal(idSet.has(999001), false);
  assert.equal(idSet.has(200_123), true);
  console.log("  ✓ cancel old prayer ids without wiping other systems");
}

{
  const prefs = enabledPrefs();
  const day = makeDay();
  const fpA = buildScheduleFingerprint(day, prefs);
  const fpB = buildScheduleFingerprint(day, {
    ...prefs,
    prayers: { ...prefs.prayers, isha: false },
  });
  assert.notEqual(fpA, fpB);
  console.log("  ✓ settings change invalidates fingerprint");
}

console.log("prayer-notifications-rebuild.test.ts: ok");
