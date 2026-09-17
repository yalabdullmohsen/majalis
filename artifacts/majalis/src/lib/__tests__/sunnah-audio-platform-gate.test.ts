/**
 * بوابة منصة الصوت + تفضيلات الصلاة v2 + الملخص.
 * node --import tsx src/lib/__tests__/sunnah-audio-platform-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultPrayerNotificationPreferences } from "../prayer-notifications/preferences";
import { buildScheduleFingerprint } from "../prayer-notifications/fingerprint";
import type { PrayerDayTimes } from "../prayer-notifications/types";
import {
  listSelectableAdhanVoices,
  listPendingAdhanVoices,
  listMurattalReciters,
} from "../sunnah-audio-platform";
import { composeContentDigest } from "../sunnah-notifications/digest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

{
  const prefs = defaultPrayerNotificationPreferences();
  assert.equal(prefs.schemaVersion, 2);
  assert.ok(prefs.alertStyleByPrayer.fajr);
  assert.equal(typeof prefs.voiceIdByPrayer.fajr, "string");
  console.log("  ✓ prayer prefs schema v2 defaults");
}

{
  const day: PrayerDayTimes = {
    timeZone: "Asia/Kuwait",
    dateISO: "2026-09-15",
    methodId: "Kuwait",
    madhabId: "Shafi",
    valid: true,
    slots: [
      { key: "fajr", nameAr: "الفجر", minutes: 300, epochMs: 1, dateISO: "2026-09-15" },
      { key: "dhuhr", nameAr: "الظهر", minutes: 720, epochMs: 2, dateISO: "2026-09-15" },
      { key: "asr", nameAr: "العصر", minutes: 900, epochMs: 3, dateISO: "2026-09-15" },
      { key: "maghrib", nameAr: "المغرب", minutes: 1080, epochMs: 4, dateISO: "2026-09-15" },
      { key: "isha", nameAr: "العشاء", minutes: 1200, epochMs: 5, dateISO: "2026-09-15" },
    ],
  };
  const a = defaultPrayerNotificationPreferences();
  a.masterEnabled = true;
  a.prayers = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
  const fp1 = buildScheduleFingerprint(day, a);
  const b = {
    ...a,
    alertStyleByPrayer: { ...a.alertStyleByPrayer, fajr: "full_adhan" as const },
  };
  assert.notEqual(fp1, buildScheduleFingerprint(day, b));
  console.log("  ✓ alert style changes fingerprint");
}

{
  const selectable = listSelectableAdhanVoices();
  assert.ok(selectable.length >= 1);
  assert.ok(selectable.every((v) => v.licenseStatus === "verified_for_production"));
  assert.ok(selectable.some((v) => v.id === "system-default"));
  assert.ok(listPendingAdhanVoices().length >= 1);
  assert.ok(listMurattalReciters().length >= 10);
  console.log("  ✓ adhan/murattal catalogs (store-safe selectable)");
}

{
  const bundle = composeContentDigest(
    [
      { id: "1", title: "درس جديد", createdAtIso: "2026-09-15T10:00:00.000Z" },
      { id: "2", title: "سلسلة", createdAtIso: "2026-09-15T11:00:00.000Z" },
    ],
    { nowIso: "2026-09-15T12:00:00.000Z" },
  );
  assert.ok(bundle);
  assert.match(bundle!.title, /سُنّة|إضافات|محتوى/);
  assert.doesNotMatch(bundle!.body, /اشتر|حصري|فرصة أخيرة/);
  console.log("  ✓ content digest calm copy");
}

{
  const page = readFileSync(
    resolve(root, "src/pages/account/ui/NotificationsAndSoundView.tsx"),
    "utf8",
  );
  assert.match(page, /الإشعارات والصوت/);
  assert.match(page, /ساعات الهدوء/);
  assert.doesNotMatch(page, /from "@\/lib\/adhan-audio"/);
  const routes = readFileSync(resolve(root, "src/AppRoutes.tsx"), "utf8");
  assert.match(routes, /notifications-and-sound/);
  assert.match(routes, /lazy\(/);
  console.log("  ✓ settings page lazy-wired");
}

{
  const legal = readFileSync(resolve(root, "docs/SUNNAH_AUDIO_LEGAL_PENDING.md"), "utf8");
  assert.match(legal, /علي ملا/);
  assert.match(legal, /pending_owner_approval|معلّق/);
  console.log("  ✓ legal pending report present");
}

console.log("sunnah-audio-platform-gate.test.ts: ok");
