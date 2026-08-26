/**
 * بوابة دقة الأذان على Apple (مسار آمن بلا تعديل pbxproj):
 * دخول الوقت بلا offset، CAF ≤٢٩ث، اسم ملف فقط، بلا Critical Alerts.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-apple-precision.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  friendlyAdhanNotificationKey,
  hashPrayerNotificationId,
} from "../prayer-notification-ids";
import { SELECTABLE_ADHAN_TYPES } from "../adhan-selectable-types";
import {
  PRAYER_ADHAN_STYLE_SOUNDS,
  PRAYER_SOUND_FILES,
  platformNotificationSoundName,
} from "../prayer-notification-sounds";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const soundsDir = join(appRoot, "ios/App/App/Sounds");
const entitlements = readFileSync(join(appRoot, "ios/App/App/App.entitlements"), "utf8");
const localNotif = readFileSync(join(appRoot, "src/lib/prayer-local-notifications.ts"), "utf8");
const settingsView = readFileSync(
  join(appRoot, "src/pages/worship/ui/AdhanSettingsView.tsx"),
  "utf8",
);
const prefsSrc = readFileSync(join(appRoot, "src/lib/adhan-preferences.ts"), "utf8");

assert.match(
  localNotif,
  /schedule:\s*\{\s*at:\s*new Date\(opts\.prayerTimeEpochMs\)/,
  "إشعار دخول الوقت يجب أن يُجدول على وقت الصلاة نفسه",
);
assert.match(localNotif, /assertIosNotificationFilename/);
assert.match(localNotif, /friendlyKey:\s*friendlyAdhanNotificationKey/);
assert.match(localNotif, /listPendingPrayerNotifications/);

for (const sound of Object.values(PRAYER_SOUND_FILES)) {
  assert.equal(sound, platformNotificationSoundName(sound));
  assert.doesNotMatch(sound, /[/\\]/);
  assert.ok(sound.endsWith(".caf"));
}
for (const sound of Object.values(PRAYER_ADHAN_STYLE_SOUNDS)) {
  assert.doesNotMatch(String(sound), /[/\\]/);
}

const MAX = 29.05;
for (const name of readdirSync(soundsDir)) {
  if (!name.startsWith("adhan-") || !name.endsWith(".caf")) continue;
  const r = spawnSync("afinfo", [join(soundsDir, name)], { encoding: "utf8" });
  if (r.status !== 0) {
    console.warn(`skip duration check for ${name}: afinfo unavailable`);
    continue;
  }
  const m = String(r.stdout).match(/estimated duration:\s*([\d.]+)\s*sec/);
  assert.ok(m, `تعذّر قراءة مدة ${name}`);
  const dur = Number(m![1]);
  assert.ok(dur <= MAX, `${name}: ${dur}s > ${MAX}s`);
}

for (const t of SELECTABLE_ADHAN_TYPES) {
  assert.ok(existsSync(join(soundsDir, t.notificationSound)), t.notificationSound);
  assert.ok(
    existsSync(join(appRoot, "public", t.inAppUrl.replace(/^\//, ""))),
    t.inAppUrl,
  );
  assert.ok(t.hint.trim().length > 0, `hint missing for ${t.id}`);
  assert.ok(
    existsSync(resolve(appRoot, "ios/App/App/Sounds", t.notificationSound)),
    t.notificationSound,
  );
  if (t.inAppUrl.startsWith("/")) {
    assert.ok(
      existsSync(resolve(appRoot, "public", t.inAppUrl.replace(/^\//, ""))),
      t.inAppUrl,
    );
  }
}

const keys = ["fajr", "dhuhr", "asr", "maghrib", "isha"].map((p) =>
  friendlyAdhanNotificationKey(p, "2026-08-23", "enter"),
);
assert.deepEqual(keys, [
  "adhan-fajr-2026-08-23",
  "adhan-dhuhr-2026-08-23",
  "adhan-asr-2026-08-23",
  "adhan-maghrib-2026-08-23",
  "adhan-isha-2026-08-23",
]);
assert.equal(
  hashPrayerNotificationId("fajr", "2026-08-23", "enter"),
  hashPrayerNotificationId("fajr", "2026-08-23", "enter"),
);
assert.notEqual(
  hashPrayerNotificationId("fajr", "2026-08-23", "enter"),
  hashPrayerNotificationId("fajr", "2026-08-23", "pre"),
);

assert.equal(entitlements.includes("critical-alerts"), false);
assert.doesNotMatch(settingsView, /تجاوز الصامت|Critical Alerts|تجاوز التركيز/);
assert.match(prefsSrc, /bypassSilentMode:\s*false/);
assert.match(settingsView, /12_000/);
assert.match(settingsView, /فشل التشغيل/);
assert.match(settingsView, /اختبار إشعار بعد ١٥ ثانية/);
assert.match(settingsView, /فحص حالة الأذان/);
assert.doesNotMatch(settingsView, /adhan-makkah-short\.caf|adhan-madinah-short\.caf/);
assert.doesNotMatch(localNotif, /adhan-makkah-short\.caf|adhan-madinah-short\.caf/);

console.log("adhan-apple-precision.test.ts: ok");
