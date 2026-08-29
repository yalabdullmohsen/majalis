/**
 * Unit gates for notification hardening (schedule signatures, constants, platform split).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { buildPrayerScheduleSignature } from "../prayer-alert-scheduler";
import {
  QURAN_DAILY_REMINDER_HOUR,
  QURAN_DAILY_REMINDER_MINUTE,
  QURAN_DAILY_REMINDER_NATIVE_ID,
} from "../quran-daily-reminder";
import { REMOTE_PUSH_ENABLED, APNS_TOKEN_STORAGE_KEY } from "../notifications/apns-scaffold";
import {
  CHANNEL_PRAYER,
  CHANNEL_QURAN,
  CHANNEL_GENERAL,
  DEFAULT_ALERT_SOUND,
} from "../notifications/channels";
import { TEST_NOTIFICATION_NATIVE_ID } from "../notifications/test-trigger";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

// ── Schedule signature: same inputs → same key; prefs/time change → different ──
{
  const base = {
    prayerKey: "Dhuhr",
    prayerTimeEpochMs: 1_700_000_000_000,
    preAlertEnabled: true,
    enterAlertEnabled: true,
    preAlertMinutes: 15,
  };
  const a = buildPrayerScheduleSignature(base);
  const b = buildPrayerScheduleSignature({ ...base, prayerKey: "dhuhr" });
  assert.equal(a, b, "prayerKey case-insensitive");
  const c = buildPrayerScheduleSignature({ ...base, preAlertEnabled: false });
  assert.notEqual(a, c, "prefs change invalidates signature");
  const d = buildPrayerScheduleSignature({
    ...base,
    prayerTimeEpochMs: base.prayerTimeEpochMs + 60_000,
  });
  assert.notEqual(a, d, "minute bucket change invalidates signature");
  console.log("  ✓ prayer schedule signature stability");
}

// ── Quran daily is 17:00 (5 PM), stable native id ──
assert.equal(QURAN_DAILY_REMINDER_HOUR, 17);
assert.equal(QURAN_DAILY_REMINDER_MINUTE, 0);
assert.equal(QURAN_DAILY_REMINDER_NATIVE_ID, 9301);
console.log("  ✓ quran daily reminder constants");

// ── APNs / remote push wiring ──
assert.equal(REMOTE_PUSH_ENABLED, true);
assert.ok(APNS_TOKEN_STORAGE_KEY.includes("apns"));
console.log("  ✓ Remote Push enabled (Capacitor)");

// ── Channels / test ids ──
assert.ok(CHANNEL_PRAYER.startsWith("majalis-"));
assert.ok(CHANNEL_QURAN.startsWith("majalis-"));
assert.ok(CHANNEL_GENERAL.startsWith("majalis-"));
assert.equal(DEFAULT_ALERT_SOUND, "default");
assert.equal(TEST_NOTIFICATION_NATIVE_ID, 99901);
console.log("  ✓ channel + test trigger constants");

// ── Source gates: native hides web push; presentationOptions; Capacitor push wired ──
{
  const push = read("src/lib/push-notifications.ts");
  assert.match(push, /isNative/, "push-notifications gates native");
  assert.match(push, /if \(isNative\) return "unsupported"/, "getPushSupport unsupported on native");

  const nativePush = read("src/lib/pushNotifications.ts");
  assert.match(nativePush, /PushNotifications/, "native helper uses Capacitor plugin");
  assert.match(nativePush, /pushNotificationReceived/, "received listener");
  assert.match(nativePush, /pushNotificationActionPerformed/, "click listener");
  assert.match(nativePush, /registerNativePushNotifications/, "register export");

  const prompt = read("src/components/PushPrompt.tsx");
  assert.match(prompt, /isNative/, "PushPrompt checks isNative");

  const settings = read("src/pages/account/ui/NotificationSettingsView.tsx");
  assert.match(settings, /fireTestLocalNotification/, "settings has test trigger");
  assert.match(settings, /getNotificationPermissionStatus/, "settings uses Capacitor-aware permission");
  assert.match(settings, /!isNative/, "settings hides PWA push section on native");

  const cap = read("capacitor.config.ts");
  assert.match(cap, /LocalNotifications/, "capacitor LocalNotifications config");
  assert.match(cap, /PushNotifications/, "capacitor PushNotifications config");
  assert.match(cap, /presentationOptions/, "iOS presentationOptions set");

  const ent = read("ios/App/App/App.entitlements");
  assert.match(ent, /aps-environment/, "aps-environment present for APNs");

  const delegate = read("ios/App/App/AppDelegate.swift");
  assert.match(delegate, /MajlisAPNs/, "AppDelegate APNs logs");
  assert.match(
    delegate,
    /capacitorDidRegisterForRemoteNotifications/,
    "AppDelegate forwards APNs token to Capacitor",
  );

  const prayer = read("src/lib/prayer-local-notifications.ts");
  assert.match(prayer, /resolvePrayerNotificationSound|safeSound/, "prayer notifications resolve sound");
  assert.match(prayer, /buildScheduledPrayerNotificationCopy/, "prayer notifications use scheduled copy with clock");
  assert.match(prayer, /channelId:\s*CHANNEL_PRAYER/, "prayer notifications set channel");
  assert.match(prayer, /allowWhileIdle:\s*true/, "prayer allowWhileIdle");
  assert.match(prayer, /hashPrayerNotificationId/, "predictable notification ids");
  assert.doesNotMatch(prayer, /— متبقي/, "no em-dash after prayer name in schedule body");

  const quran = read("src/lib/quran-daily-reminder.ts");
  assert.match(quran, /ensureQuranDailyReminderScheduled/, "ensure helper exported");
  assert.match(quran, /sound:\s*DEFAULT_ALERT_SOUND/, "quran sound set");

  const scheduler = read("src/lib/prayer-alert-scheduler.ts");
  assert.match(scheduler, /invalidatePrayerNativeSchedule/, "invalidate helper");
  assert.match(scheduler, /buildPrayerScheduleSignature/, "signature helper");
  assert.match(scheduler, /forceNativeReschedule/, "force reschedule option");
  assert.match(scheduler, /listNativePrayerScheduleSlots/, "schedules all obligatory slots");
  assert.match(scheduler, /cancelAllPrayerNativeNotifications/, "cancels when both alerts off");

  const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
  assert.match(app, /NativeNotificationsBootstrap/, "App boots native notifications");
  assert.match(app, /force:\s*true/, "visibility recheck forces reschedule");
  assert.match(app, /appStateChange/, "Capacitor appStateChange resume path");
  assert.match(app, /import\("@\/lib\/prayer-alert-scheduler"\)/, "scheduler loaded after first paint");
  assert.doesNotMatch(app, /from ["']@\/lib\/prayer-alert-scheduler["']/, "no static scheduler on boot");

  const quranSrc = read("src/lib/quran-daily-reminder.ts");
  assert.match(quranSrc, /cancelNativeQuranReminder/, "cancel without flipping prefs");
  assert.match(quranSrc, /cancelNativeQuranReminder\(\)/, "ensure cancels when disabled");

  const boot = read("src/lib/notifications/native-bootstrap.ts");
  assert.match(boot, /localNotificationActionPerformed/, "tap listener");
  assert.match(boot, /bootstrapNativeNotifications/, "bootstrap export");
  assert.match(boot, /maybeRegisterRemotePush/, "remote push on boot");

  console.log("  ✓ source architecture gates");
}

console.log("\nnotifications-hardening: all checks passed");
