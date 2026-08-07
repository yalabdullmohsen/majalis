#!/usr/bin/env node
/**
 * Static + unit gates for iOS/Web notification hardening.
 * Runnable on Linux CI (no Xcode / no physical device).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;

function ok(cond, msg) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

console.log("=== iOS / Web notifications hardening gates ===\n");

// Files exist
const required = [
  "src/lib/prayer-local-notifications.ts",
  "src/lib/prayer-alert-scheduler.ts",
  "src/lib/prayer-notification-copy.ts",
  "src/lib/prayer-notification-sounds.ts",
  "src/lib/quran-daily-reminder.ts",
  "src/lib/local-notifications.ts",
  "src/lib/push-notifications.ts",
  "src/lib/pushNotifications.ts",
  "src/lib/notifications/channels.ts",
  "src/lib/notifications/apns-scaffold.ts",
  "src/lib/notifications/test-trigger.ts",
  "src/lib/notifications/native-bootstrap.ts",
  "src/components/PushPrompt.tsx",
  "src/pages/account/ui/NotificationSettingsView.tsx",
  "ios/App/App/AppDelegate.swift",
  "ios/App/App/App.entitlements",
  "capacitor.config.ts",
];
for (const rel of required) {
  ok(existsSync(join(root, rel)), `exists ${rel}`);
}

const pkg = JSON.parse(read("package.json"));
ok(
  Boolean(pkg.dependencies?.["@capacitor/local-notifications"] || pkg.devDependencies?.["@capacitor/local-notifications"]),
  "@capacitor/local-notifications dependency",
);
ok(
  Boolean(pkg.dependencies?.["@capacitor/push-notifications"] || pkg.devDependencies?.["@capacitor/push-notifications"]),
  "@capacitor/push-notifications dependency",
);

const plist = read("ios/App/App/Info.plist");
ok(plist.includes("NSUserNotificationsUsageDescription"), "NSUserNotificationsUsageDescription");
ok(plist.includes("<string>remote-notification</string>"), "remote-notification background mode");

const ent = read("ios/App/App/App.entitlements");
ok(ent.includes("aps-environment"), "App.entitlements has aps-environment");

const cap = read("capacitor.config.ts");
ok(cap.includes("LocalNotifications"), "capacitor.config LocalNotifications");
ok(cap.includes("PushNotifications"), "capacitor.config PushNotifications");
ok(cap.includes("presentationOptions"), "presentationOptions for iOS sound/badge/banner");

const push = read("src/lib/push-notifications.ts");
ok(push.includes("isNative"), "push-notifications native gate");
ok(/if \(isNative\) return "unsupported"/.test(push), "getPushSupport unsupported on native");

const nativePush = read("src/lib/pushNotifications.ts");
ok(nativePush.includes("registerNativePushNotifications"), "native push helper");
ok(nativePush.includes("pushNotificationReceived"), "received listener");
ok(nativePush.includes("pushNotificationActionPerformed"), "click listener");

const prompt = read("src/components/PushPrompt.tsx");
ok(prompt.includes("isNative"), "PushPrompt hides on native");

const settings = read("src/pages/account/ui/NotificationSettingsView.tsx");
ok(settings.includes("fireTestLocalNotification"), "test notification trigger in settings");
ok(settings.includes("getNotificationPermissionStatus"), "Capacitor-aware permission status");
ok(settings.includes("notifDebug"), "hidden developer debug flag");

const prayer = read("src/lib/prayer-local-notifications.ts");
ok(prayer.includes("DEFAULT_ALERT_SOUND"), "prayer sound fallback import");
ok(prayer.includes("pickPrayerNotificationCopy"), "prayer varied copy");
ok(prayer.includes("resolvePrayerNotificationSound") || prayer.includes("safeSound"), "prayer sound resolve");
ok(prayer.includes("CHANNEL_PRAYER"), "prayer channel");
ok(prayer.includes("allowWhileIdle"), "prayer allowWhileIdle");
ok(!prayer.includes("— متبقي"), "no em-dash after prayer name");

const copy = read("src/lib/prayer-notification-copy.ts");
ok(copy.includes("pre-15"), "copy pools include pre-15");
ok(copy.includes("post-soft"), "copy pools include post-soft");
ok(!/اقتربت صلاة \{\{name\}\} —/.test(copy), "copy templates avoid em-dash after name");

const sounds = read("src/lib/prayer-notification-sounds.ts");
ok(sounds.includes("PRAYER_CUSTOM_SOUNDS_ENABLED"), "custom sounds flag");
ok(sounds.includes("prayer_quiet.caf"), "quiet sound filename");
ok(sounds.includes("DEFAULT_ALERT_SOUND"), "sound fallback to default");

const quran = read("src/lib/quran-daily-reminder.ts");
ok(quran.includes("ensureQuranDailyReminderScheduled"), "ensureQuranDailyReminderScheduled");
ok(quran.includes("QURAN_DAILY_REMINDER_HOUR = 17"), "daily Quran at 17:00");

const scheduler = read("src/lib/prayer-alert-scheduler.ts");
ok(scheduler.includes("buildPrayerScheduleSignature"), "schedule signature");
ok(scheduler.includes("invalidatePrayerNativeSchedule"), "invalidate helper");
ok(scheduler.includes("forceNativeReschedule"), "force reschedule");
ok(scheduler.includes("listNativePrayerScheduleSlots"), "all-obligatory native slots");
ok(scheduler.includes("cancelAllPrayerNativeNotifications"), "cancel-all when alerts off");

const app = read("src/App.tsx");
ok(app.includes("NativeNotificationsBootstrap"), "App native notifications bootstrap");
ok(app.includes("PRAYER_ALERT_PREFS_CHANGED_EVENT"), "prefs-changed listener");
ok(app.includes("appStateChange"), "Capacitor appStateChange resume");

const quranSrc = read("src/lib/quran-daily-reminder.ts");
ok(quranSrc.includes("cancelNativeQuranReminder"), "cancelNativeQuranReminder export");

const boot = read("src/lib/notifications/native-bootstrap.ts");
ok(boot.includes("localNotificationActionPerformed"), "notification tap deep-link listener");
ok(boot.includes("maybeRegisterRemotePush"), "APNs/remote push hook on boot");

const apns = read("src/lib/notifications/apns-scaffold.ts");
ok(apns.includes("REMOTE_PUSH_ENABLED"), "REMOTE_PUSH_ENABLED export");
ok(apns.includes("registerNativePushNotifications") || apns.includes("pushNotifications"), "wires native helper");

const delegate = read("ios/App/App/AppDelegate.swift");
ok(delegate.includes("MajlisAPNs"), "AppDelegate APNs diagnostic stubs");
ok(
  delegate.includes("capacitorDidRegisterForRemoteNotifications"),
  "forwards APNs token to Capacitor",
);
ok(
  !/^\s*UIApplication\.shared\.registerForRemoteNotifications/m.test(delegate),
  "JS plugin owns registerForRemoteNotifications (no direct AppDelegate call)",
);

const main = read("src/main.tsx");
ok(main.includes("if (!isNative)"), "SW registration skipped on native");

console.log("\n--- unit suite ---\n");
for (const unitFile of [
  "src/lib/__tests__/notifications-hardening.test.ts",
  "src/lib/__tests__/prayer-notification-copy-sounds.test.ts",
]) {
  const unit = spawnSync(
    process.execPath,
    ["--import", "tsx", unitFile],
    { cwd: root, stdio: "inherit", env: process.env },
  );
  if (unit.status !== 0) failed++;
}
if (failed > 0) {
  console.error(`\nFAILED: ${failed} check(s)`);
  process.exit(1);
}
console.log("\n=== test:ios-notifications OK ===");
