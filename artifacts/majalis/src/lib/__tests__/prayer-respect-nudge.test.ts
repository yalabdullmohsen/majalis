/**
 * بوابة: تذكير احترام الصلاة من الأذان حتى ١٠ دقائق + رسائل متنوعة.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRAYER_RESPECT_MESSAGES,
  PRAYER_RESPECT_POST_MINUTES,
  isWithinPrayerRespectWindow,
  pickPrayerRespectMessage,
} from "../prayer-respect-nudge";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

assert.equal(PRAYER_RESPECT_POST_MINUTES, 10);
assert.ok(PRAYER_RESPECT_MESSAGES.length >= 3, "رسائل متنوعة ≥ ٣");

assert.equal(isWithinPrayerRespectWindow(0), true);
assert.equal(isWithinPrayerRespectWindow(9 * 60), true);
assert.equal(isWithinPrayerRespectWindow(10 * 60), true);
assert.equal(isWithinPrayerRespectWindow(10 * 60 + 1), false);
assert.equal(isWithinPrayerRespectWindow(null), false);
assert.equal(isWithinPrayerRespectWindow(-1), false);

const a = pickPrayerRespectMessage("Dhuhr", 0, "2026-08-31");
const b = pickPrayerRespectMessage("Dhuhr", 0, "2026-08-31");
assert.equal(a.body, b.body, "نفس الصلاة/اليوم → نفس الرسالة في نفس الشريحة");
assert.match(a.body, /صامت|الجوال|أغلق/);

const later = pickPrayerRespectMessage("Dhuhr", 180, "2026-08-31");
assert.match(later.body, /صامت|الجوال|أغلق/);

const prefs = readFileSync(join(root, "lib/prayer-alert-preferences.ts"), "utf8");
assert.match(prefs, /POST_REMINDER_MINUTES\s*=\s*10/);
assert.match(prefs, /postReminderEnabled:\s*true/);

const banner = readFileSync(join(root, "components/adhan/PrayerRespectBanner.tsx"), "utf8");
assert.match(banner, /isWithinPrayerRespectWindow/);
assert.match(banner, /pickPrayerRespectMessage/);
assert.match(banner, /ADHAN_EVENT_NAME/);

const copy = readFileSync(join(root, "lib/prayer-notification-copy.ts"), "utf8");
assert.match(copy, /pickPrayerRespectPostBody/);
assert.match(copy, /وضع الصامت|أغلق الجوال/);

console.log("prayer-respect-nudge.test.ts: ok");
