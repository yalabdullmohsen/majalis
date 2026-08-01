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
  "src/lib/quran-daily-reminder.ts",
  "src/lib/local-notifications.ts",
  "src/lib/push-notifications.ts",
  "src/lib/notifications/channels.ts",
  "src/lib/notifications/apns-scaffold.ts",
  "src/lib/notifications/test-trigger.ts",
  "src/lib/notifications/native-bootstrap.ts",
  "src/components/PushPrompt.tsx",
  "src/views/NotificationSettingsPage.tsx",
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
  !pkg.dependencies?.["@capacitor/push-notifications"] &&
    !pkg.devDependencies?.["@capacitor/push-notifications"],
  "no @capacitor/push-notifications (Local Notifications primary)",
);

const plist = read("ios/App/App/Info.plist");
ok(plist.includes("NSUserNotificationsUsageDescription"), "NSUserNotificationsUsageDescription");
ok(!plist.includes("<string>remote-notification</string>"), "no remote-notification background mode (APNs off)");

const ent = read("ios/App/App/App.entitlements");
ok(!ent.includes("aps-environment"), "App.entitlements has no aps-environment");

const cap = read("capacitor.config.ts");
ok(cap.includes("LocalNotifications"), "capacitor.config LocalNotifications");
ok(cap.includes("presentationOptions"), "presentationOptions for iOS sound/badge/banner");

const push = read("src/lib/push-notifications.ts");
ok(push.includes("isNative"), "push-notifications native gate");
ok(/if \(isNative\) return "unsupported"/.test(push), "getPushSupport unsupported on native");

const prompt = read("src/components/PushPrompt.tsx");
ok(prompt.includes("isNative"), "PushPrompt hides on native");

const settings = read("src/views/NotificationSettingsPage.tsx");
ok(settings.includes("fireTestLocalNotification"), "test notification trigger in settings");
ok(settings.includes("getNotificationPermissionStatus"), "Capacitor-aware permission status");
ok(settings.includes("notifDebug"), "hidden developer debug flag");

const prayer = read("src/lib/prayer-local-notifications.ts");
ok(prayer.includes("DEFAULT_ALERT_SOUND"), "prayer sound");
ok(prayer.includes("CHANNEL_PRAYER"), "prayer channel");
ok(prayer.includes("allowWhileIdle"), "prayer allowWhileIdle");

const quran = read("src/lib/quran-daily-reminder.ts");
ok(quran.includes("ensureQuranDailyReminderScheduled"), "ensureQuranDailyReminderScheduled");
ok(quran.includes("QURAN_DAILY_REMINDER_HOUR = 17"), "daily Quran at 17:00");

const scheduler = read("src/lib/prayer-alert-scheduler.ts");
ok(scheduler.includes("buildPrayerScheduleSignature"), "schedule signature");
ok(scheduler.includes("invalidatePrayerNativeSchedule"), "invalidate helper");
ok(scheduler.includes("forceNativeReschedule"), "force reschedule");

const app = read("src/App.tsx");
ok(app.includes("NativeNotificationsBootstrap"), "App native notifications bootstrap");
ok(app.includes("PRAYER_ALERT_PREFS_CHANGED_EVENT"), "prefs-changed listener");

const boot = read("src/lib/notifications/native-bootstrap.ts");
ok(boot.includes("localNotificationActionPerformed"), "notification tap deep-link listener");
ok(boot.includes("maybeRegisterRemotePush"), "APNs scaffold hook on boot");

const apns = read("src/lib/notifications/apns-scaffold.ts");
ok(apns.includes("REMOTE_PUSH_ENABLED = false"), "REMOTE_PUSH_ENABLED false");

const delegate = read("ios/App/App/AppDelegate.swift");
ok(delegate.includes("MajlisAPNs"), "AppDelegate APNs diagnostic stubs");
ok(
  !/^\s*UIApplication\.shared\.registerForRemoteNotifications/m.test(delegate),
  "does not register for remote notifications",
);

const main = read("src/main.tsx");
ok(main.includes("if (!isNative)"), "SW registration skipped on native");

console.log("\n--- unit suite ---\n");
const unit = spawnSync(
  process.execPath,
  ["--import", "tsx", "src/lib/__tests__/notifications-hardening.test.ts"],
  { cwd: root, stdio: "inherit", env: process.env },
);
if (unit.status !== 0) failed++;

if (failed > 0) {
  console.error(`\nFAILED: ${failed} check(s)`);
  process.exit(1);
}
console.log("\n=== test:ios-notifications OK ===");
