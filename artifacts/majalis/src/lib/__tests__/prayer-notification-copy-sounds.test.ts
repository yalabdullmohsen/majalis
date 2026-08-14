/**
 * بوابة نصوص وأصوات إشعارات الصلاة.
 */
import assert from "node:assert/strict";
import {
  listPrayerNotificationTemplates,
  pickPrayerNotificationCopy,
  preAlertKindForMinutes,
} from "../prayer-notification-copy";
import {
  DEFAULT_ALERT_SOUND,
} from "../notifications/channels";
import {
  PRAYER_CUSTOM_SOUNDS_ENABLED,
  PRAYER_SOUND_FILES,
  resolvePrayerNotificationSound,
  soundRoleForNotifKind,
} from "../prayer-notification-sounds";

// ── لا شرطة طويلة في أي قالب ──
{
  const all = listPrayerNotificationTemplates();
  for (const [kind, pool] of Object.entries(all)) {
    for (const tpl of pool) {
      assert.ok(!tpl.title.includes("—"), `${kind} title has em-dash`);
      assert.ok(!tpl.body.includes("—"), `${kind} body has em-dash`);
      assert.ok(tpl.body.includes("{{name}}"), `${kind} body must include {{name}}`);
    }
  }
  console.log("  ✓ prayer copy templates have no em-dash");
}

// ── اختيار النص بلا شرطة وبعد اسم الصلاة ──
{
  const samples = [
    pickPrayerNotificationCopy("pre-15", "العصر", 15),
    pickPrayerNotificationCopy("pre-10", "العصر", 10),
    pickPrayerNotificationCopy("pre-5", "العصر", 5),
    pickPrayerNotificationCopy("enter", "العصر"),
    pickPrayerNotificationCopy("post-soft", "العصر"),
  ];
  for (const c of samples) {
    assert.ok(c.title.length > 0, "title non-empty");
    assert.ok(c.body.length > 0, "body non-empty");
    assert.ok(!c.body.includes("—"), `body has em-dash: ${c.body}`);
    assert.ok(!/صلاة\s+\S+\s*—/.test(c.body), `em-dash after prayer name: ${c.body}`);
    assert.match(c.body, /العصر/, `body mentions prayer: ${c.body}`);
  }
  console.log("  ✓ pickPrayerNotificationCopy natural Arabic without em-dash");
}

assert.equal(preAlertKindForMinutes(15), "pre-15");
assert.equal(preAlertKindForMinutes(10), "pre-10");
assert.equal(preAlertKindForMinutes(5), "pre-5");
assert.equal(preAlertKindForMinutes(7), "pre-10");
console.log("  ✓ preAlertKindForMinutes buckets");

// ── أصوات: مفعّلة بعد تضمين ملفات الحزمة ──
assert.equal(PRAYER_CUSTOM_SOUNDS_ENABLED, true);
assert.equal(resolvePrayerNotificationSound("quiet", "system"), DEFAULT_ALERT_SOUND);
assert.equal(resolvePrayerNotificationSound("quiet", "auto"), "prayer_quiet.caf");
assert.equal(resolvePrayerNotificationSound("clear", "auto"), "prayer_clear.caf");
assert.equal(resolvePrayerNotificationSound("soft", "clear"), "prayer_clear.caf");
assert.equal(soundRoleForNotifKind("pre"), "quiet");
assert.equal(soundRoleForNotifKind("enter"), "clear");
assert.equal(soundRoleForNotifKind("post"), "soft");
assert.ok(PRAYER_SOUND_FILES.quiet.endsWith(".caf"));
console.log("  ✓ prayer sound resolve uses custom caf when enabled");

console.log("\nprayer-notification-copy-sounds: all checks passed");
