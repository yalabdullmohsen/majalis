/**
 * بوابة P0 لمحرك الصلاة/الأذان: جدولة تفاضلية، منطقة زمنية، إخفاء أدوات المطوّر، ترحيل، واجهة موحّدة.
 * Run: node --import tsx src/lib/__tests__/prayer-engine-p0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

function read(rel: string): string {
  return readFileSync(join(appRoot, rel), "utf8");
}

for (const rel of [
  "src/lib/prayer-time-engine.ts",
  "src/lib/prayer-settings-migration.ts",
  "src/lib/prayer-alert-scheduler.ts",
  "src/lib/prayer-local-notifications.ts",
  "src/pages/worship/ui/AdhanSettingsView.tsx",
]) {
  assert.ok(existsSync(join(appRoot, rel)), `missing ${rel}`);
}

const scheduler = read("src/lib/prayer-alert-scheduler.ts");
const localNotif = read("src/lib/prayer-local-notifications.ts");
const settingsView = read("src/pages/worship/ui/AdhanSettingsView.tsx");
const migration = read("src/lib/prayer-settings-migration.ts");
const engine = read("src/lib/prayer-time-engine.ts");
const app = read("src/App.tsx");
const adhanSched = read("src/lib/adhan-scheduler.ts");
const idsSrc = read("src/lib/prayer-notification-ids.ts");

assert.match(localNotif, /cancelPrayerNativeNotificationsExcept/);
assert.match(scheduler, /keepIds/);
assert.match(scheduler, /cancelPrayerNativeNotificationsExcept/);

{
  const start = scheduler.search(/async function reschedule\w*Native/);
  assert.ok(start >= 0, "reschedule native function missing");
  const slice = scheduler.slice(start, start + 2500);
  assert.match(slice, /keepIds/);
  assert.match(slice, /Except\(/);
}

assert.match(idsSrc, /hashPrayerNotificationId/);
{
  const { hashPrayerNotificationId } = await import("../prayer-notification-ids");
  const a = hashPrayerNotificationId("fajr", "2026-09-10", "enter");
  const b = hashPrayerNotificationId("fajr", "2026-09-10", "enter");
  const c = hashPrayerNotificationId("fajr", "2026-09-10", "pre");
  assert.equal(a, b);
  assert.notEqual(a, c);
}

assert.match(settingsView, /useAdhanDeveloperTools/);
assert.match(settingsView, /import\.meta\.env\.DEV/);
assert.match(settingsView, /adhanDebug/);
assert.match(settingsView, /showDeveloperTools \?/);
assert.match(settingsView, /فحص حالة الأذان/);
assert.match(settingsView, /حذف القديمة وإعادة الضبط/);

assert.match(migration, /PRAYER_SETTINGS_MIGRATION_VERSION/);
assert.match(migration, /migratePrayerSettingsIfNeeded/);
assert.match(app, /migratePrayerSettingsIfNeeded/);
assert.match(app, /PrayerSettingsMigrationBoot/);

assert.match(engine, /computePrayerEngineDay/);
assert.match(engine, /from "\.\/prayer-times"/);

assert.match(app, /getActivePrayerLocation/);
{
  const start = app.indexOf("PrayerAlertSchedulerBootstrap");
  assert.ok(start >= 0);
  const slice = app.slice(start, start + 4000);
  assert.doesNotMatch(slice, /timeZone:\s*"Asia\/Kuwait"/);
}

assert.match(adhanSched, /NATIVE_ALERTS_OWN_AUDIO_V1/);
assert.match(adhanSched, /loadPrayerAlertPrefs/);

console.log("prayer-engine-p0-gate.test.ts: ok");
