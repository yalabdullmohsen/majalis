/**
 * بوابة سياسات إشعارات سُنّة.
 * تشغيل: node --import tsx src/lib/__tests__/sunnah-notifications-policy-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const mem = new Map<string, string>();
(globalThis as { localStorage: Storage }).localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k, v) => void mem.set(k, String(v)),
  removeItem: (k) => void mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  get length() {
    return mem.size;
  },
} as Storage;

const api = await import("../sunnah-notifications/index.ts");

api.bootstrapSunnahNotifications();
let prefs = api.loadSunnahNotificationPrefs();
assert.equal(prefs.channels.learning.enabled, false);
assert.equal(prefs.channels.new_content.enabled, false);
assert.equal(prefs.channels.reminders.enabled, false);
assert.equal(prefs.channels.product_updates.enabled, false);
assert.equal(prefs.channels.operational.enabled, true);
assert.equal(prefs.nonEssentialMasterEnabled, false);

prefs = api.updateSunnahChannel("learning", { enabled: true });
assert.equal(api.isChannelEffectivelyEnabled(prefs, "learning"), true);
prefs = api.disableAllNonEssentialChannels();
assert.equal(prefs.channels.learning.enabled, false);
assert.equal(api.CHANNEL_POLICIES.prayer.subjectToNonEssentialCaps, false);
assert.equal(api.CHANNEL_POLICIES.prayer.subjectToQuietHours, false);

assert.equal(
  api.isWithinQuietHours(
    { enabled: true, startHour: 22, endHour: 8 },
    new Date("2026-06-01T23:00:00"),
  ),
  true,
);
assert.equal(
  api.isWithinQuietHours(
    { enabled: true, startHour: 22, endHour: 8 },
    new Date("2026-06-01T10:00:00"),
  ),
  false,
);

api.updateSunnahChannel("learning", { enabled: true });
const expiredDuringQuiet = api.evaluateNotificationEligibility({
  channel: "learning",
  entityId: "l1",
  eventType: "lesson_resume",
  deepLink: "/lesson/l1",
  prefs: api.loadSunnahNotificationPrefs(),
  now: new Date("2026-06-01T23:30:00"),
  expiresAt: new Date("2026-06-01T23:45:00").toISOString(),
});
assert.equal(expiredDuringQuiet.ok, false);
if (!expiredDuringQuiet.ok) {
  assert.equal(expiredDuringQuiet.reason, "expired");
}

const deferred = api.evaluateNotificationEligibility({
  channel: "learning",
  entityId: "l2",
  eventType: "lesson_resume",
  deepLink: "/lesson/l2",
  prefs: api.loadSunnahNotificationPrefs(),
  now: new Date("2026-06-01T23:30:00"),
  expiresAt: new Date("2026-06-02T12:00:00").toISOString(),
});
assert.equal(deferred.ok, true);
if (deferred.ok) {
  assert.ok(Date.parse(deferred.deliverAt) > Date.parse("2026-06-01T23:30:00"));
}

const prayerPrefs = api.loadSunnahNotificationPrefs();
prayerPrefs.channels.prayer = { enabled: true, cadence: "immediate" };
const prayerElig = api.evaluateNotificationEligibility({
  channel: "prayer",
  entityId: "dhuhr",
  eventType: "adhan",
  prefs: prayerPrefs,
  now: new Date("2026-06-01T23:30:00"),
});
assert.equal(prayerElig.ok, true);
if (prayerElig.ok) assert.equal(prayerElig.transport, "local");

assert.equal(api.sanitizeSunnahDeepLink("https://evil.example"), null);
assert.equal(api.sanitizeSunnahDeepLink("/lesson/abc"), "/lesson/abc");

const key = api.buildDedupeKey({
  userId: "u1",
  channel: "learning",
  entityId: "lesson-9",
  eventType: "lesson_resume",
  scheduledPeriod: "2026-06-01",
});
api.upsertDedupeRecord({
  key,
  channel: "learning",
  status: "sent",
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  transport: "local",
});
assert.equal(api.hasActiveDedupe(key), true);

mem.clear();
api.bootstrapSunnahNotifications();
api.updateSunnahChannel("learning", { enabled: true });
assert.equal(api.checkNonEssentialRateLimit("learning").ok, true);
api.recordNonEssentialSend("learning");
assert.equal(api.checkNonEssentialRateLimit("learning").ok, false);

const composed = api.composeSunnahNotification({
  channel: "learning",
  kind: "lesson_resume",
  entityTitle: "شرح الأصول الثلاثة",
  deepLink: "/lesson/1",
});
assert.match(composed.body, /موضع توقفك/);
assert.doesNotMatch(composed.body, /فاتك|ارجع الآن/);

assert.equal(api.CHANNEL_POLICIES.learning.transport, "local");
assert.equal(api.CHANNEL_POLICIES.new_content.transport, "push");

const nativeBoot = read("src/lib/notifications/native-bootstrap.ts");
assert.doesNotMatch(nativeBoot, /LocalNotifications\.requestPermissions/);
assert.match(nativeBoot, /bootstrapSunnahNotifications/);

const panel = read("src/components/notifications/SunnahChannelsPanel.tsx");
assert.match(panel, /إيقاف جميع الإشعارات غير الضرورية/);
assert.match(panel, /ساعات الهدوء/);
assert.match(read("src/pages/account/ui/NotificationSettingsView.tsx"), /SunnahChannelsPanel/);

const sections = read("src/lib/notifications/sections-config.ts");
assert.match(sections, /id:\s*"prayer"[\s\S]*?enabled:\s*true/);
assert.match(sections, /id:\s*"quran"[\s\S]*?enabled:\s*false/);
assert.match(sections, /id:\s*"lessons"[\s\S]*?enabled:\s*false/);

console.log("sunnah-notifications-policy-gate.test.ts: ok");
