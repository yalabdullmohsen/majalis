/**
 * عقد أندرويد للأذان الكامل — وجود الملفات والصلاحيات في الـmanifest.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-android-alarm.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const manifest = readFileSync(
  resolve(appRoot, "android/app/src/main/AndroidManifest.xml"),
  "utf8",
);

assert.match(manifest, /AdhanPlaybackService/);
assert.match(manifest, /AdhanAlarmReceiver/);
assert.match(manifest, /AdhanBootReceiver/);
assert.match(manifest, /BOOT_COMPLETED/);
assert.match(manifest, /SCHEDULE_EXACT_ALARM/);
assert.match(manifest, /FOREGROUND_SERVICE_MEDIA_PLAYBACK/);

const files = [
  "android/app/src/main/java/com/majlisilm/app/AdhanPlaybackService.kt",
  "android/app/src/main/java/com/majlisilm/app/AdhanAlarmReceiver.kt",
  "android/app/src/main/java/com/majlisilm/app/AdhanBootReceiver.kt",
  "android/app/src/main/java/com/majlisilm/app/MajlisAdhanAlarmPlugin.kt",
  "src/lib/adhan-android-alarm.ts",
];
for (const f of files) {
  assert.ok(existsSync(resolve(appRoot, f)), f);
}

const main = readFileSync(
  resolve(appRoot, "android/app/src/main/java/com/majlisilm/app/MainActivity.java"),
  "utf8",
);
assert.match(main, /MajlisAdhanAlarmPlugin/);
assert.match(main, /EXTRA_ADHAN_RESCHEDULE|majlis_adhan_reschedule/);
assert.match(main, /majalis:boot-adhan-reschedule/);

const bridge = readFileSync(resolve(appRoot, "src/lib/adhan-android-alarm.ts"), "utf8");
assert.match(bridge, /getAndroidAdhanPermissionStatus/);
assert.match(bridge, /playAndroidAdhanNow/);
assert.doesNotMatch(bridge, /notifee|@notifee/i);

const settings = readFileSync(
  resolve(appRoot, "src/pages/worship/ui/AdhanSettingsView.tsx"),
  "utf8",
);
assert.match(settings, /AndroidAdhanNativeCard/);
assert.match(settings, /playAndroidAdhanNow/);
assert.match(settings, /حماية تشغيل الخلفية \(أندroid\)/);
assert.doesNotMatch(settings, /notifee|critical:\s*true|Critical Alerts/i);

const plugin = readFileSync(
  resolve(appRoot, "android/app/src/main/java/com/majlisilm/app/MajlisAdhanAlarmPlugin.kt"),
  "utf8",
);
assert.match(plugin, /setExactAndAllowWhileIdle/);
assert.match(plugin, /REQUEST_IGNORE_BATTERY_OPTIMIZATIONS|requestIgnoreBatteryOptimizations/);

const svc = readFileSync(
  resolve(appRoot, "android/app/src/main/java/com/majlisilm/app/AdhanPlaybackService.kt"),
  "utf8",
);
assert.match(svc, /USAGE_ALARM/);
assert.match(svc, /إيقاف/);

console.log("adhan-android-alarm.test.ts: ok");
