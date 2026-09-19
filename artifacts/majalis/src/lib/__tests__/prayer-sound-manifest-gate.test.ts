/**
 * بوابة Manifest أصوات الصلاة + التحقق من Bundle.
 * تشغيل: node --import tsx src/lib/__tests__/prayer-sound-manifest-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  IOS_NOTIFICATION_SOUND_MAX_SEC,
  listBlockedManifestEntries,
  listEnabledNotificationSounds,
  resolveNativeNotificationSound,
  validateManifestIntegrity,
  PRAYER_SOUND_MANIFEST,
} from "../prayer-sound-manifest";
import { resolveAdhanStyleNotificationSound } from "../prayer-notification-sounds";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const soundsDir = join(root, "ios/App/App/Sounds");
const pbx = join(root, "ios/App/App.xcodeproj/project.pbxproj");
const pbxText = readFileSync(pbx, "utf8");
const onDisk = new Set(readdirSync(soundsDir));

const integrity = validateManifestIntegrity();
assert.deepEqual(integrity, [], `manifest integrity: ${integrity.join("; ")}`);

const enabled = listEnabledNotificationSounds();
assert.ok(enabled.length >= 5, "expected ≥5 enabled notification sounds");

for (const e of enabled) {
  if (e.category !== "CUSTOM_NOTIFICATION_SOUND" && e.category !== "EARLY_REMINDER") continue;
  assert.ok(e.nativeFileName, `${e.id} missing nativeFileName`);
  assert.ok(onDisk.has(e.nativeFileName!), `missing on disk: ${e.nativeFileName}`);
  assert.ok(statSync(join(soundsDir, e.nativeFileName!)).size > 1000, `too small ${e.nativeFileName}`);
  assert.ok(pbxText.includes(e.nativeFileName!), `pbxproj missing ${e.nativeFileName}`);
  assert.ok(
    pbxText.includes(`${e.nativeFileName} in Resources`),
    `Copy Bundle Resources missing ${e.nativeFileName}`,
  );
  if (e.durationSec != null) {
    assert.ok(
      e.durationSec <= IOS_NOTIFICATION_SOUND_MAX_SEC,
      `${e.id} duration ${e.durationSec} > ${IOS_NOTIFICATION_SOUND_MAX_SEC}`,
    );
  }
}

const blocked = listBlockedManifestEntries();
assert.ok(blocked.some((e) => e.id === "blocked-qatami"));

for (const e of PRAYER_SOUND_MANIFEST.filter((x) => x.category === "IN_APP_ADHAN" && x.enabled)) {
  assert.equal(e.notificationCompatible, false, `${e.id} must not be notificationCompatible`);
}

const makkah = resolveNativeNotificationSound({ muezzinId: "makkah" });
assert.equal(makkah.sound, "adhan-short-makkah.caf");
assert.equal(makkah.fallbackUsed, false);

const egypt = resolveNativeNotificationSound({ muezzinId: "egypt" });
assert.equal(egypt.sound, "adhan-short-egypt.caf");

const aqsa = resolveNativeNotificationSound({ muezzinId: "aqsa" });
assert.equal(aqsa.sound, "adhan-short-aqsa.caf");

const inApp = resolveNativeNotificationSound({ manifestId: "in-app-makkah" });
assert.equal(inApp.sound, "default");
assert.equal(inApp.fallbackUsed, true);

assert.match(resolveAdhanStyleNotificationSound("makkah"), /adhan-short-makkah\.caf|default/);
assert.match(resolveAdhanStyleNotificationSound("egypt"), /adhan-short-egypt\.caf|default/);

const local = readFileSync(resolve(root, "src/lib/prayer-local-notifications.ts"), "utf8");
assert.match(local, /resolveNativeNotificationSound/);
assert.match(local, /readRememberedAdhanSoundId|getSettingsSoundOption/);

const offline = readFileSync(resolve(root, "src/lib/adhan-offline-assets.ts"), "utf8");
assert.match(offline, /notificationSound:\s*"adhan-short-makkah\.caf"/);

const catalog = readFileSync(resolve(root, "src/lib/adhan-settings-sound-catalog.ts"), "utf8");
assert.match(catalog, /iosNotificationSound:\s*"adhan-short-makkah\.caf"/);

assert.ok(existsSync(resolve(root, "docs/prayer-notification-root-cause-pr1.md")));

console.log("prayer-sound-manifest-gate.test.ts: ok");
