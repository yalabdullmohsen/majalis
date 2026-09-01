/**
 * تذكيرات عبارات الذكر الصوتية — جدولة وثبات المعرّفات.
 * تشغيل: node --import tsx src/lib/__tests__/dhikr-phrase-reminders.test.ts
 */
import assert from "node:assert/strict";
import {
  DHIKR_PHRASE_NATIVE_ID_BASE,
  DHIKR_PHRASE_REMINDER_BODY,
  DHIKR_PHRASE_REMINDER_URL,
  DHIKR_PHRASE_SLOTS,
  allDhikrPhraseNativeIds,
  dhikrPhraseNativeId,
  dhikrPhraseTag,
} from "../dhikr-phrase-reminders";
import { buildDailySmartSchedule } from "../smart-local-notifications";
import { QURAN_DAILY_REMINDER_NATIVE_ID } from "../quran-daily-reminder";
import { TEST_NOTIFICATION_NATIVE_ID } from "../notifications/test-trigger";

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  get length() {
    return mem.size;
  },
} as Storage;

assert.equal(DHIKR_PHRASE_SLOTS.length, 7, "سبع عبارات ذكر");
assert.deepEqual(
  DHIKR_PHRASE_SLOTS.map((s) => s.phrase),
  [
    "سبحان الله",
    "الحمد لله",
    "الله أكبر",
    "لا إله إلا الله",
    "الصلاة على النبي ﷺ",
    "أستغفر الله",
    "لا حول ولا قوة إلا بالله",
  ],
  "العبارات مطابقة لأوراد التسبيح الافتراضية",
);
assert.deepEqual(
  DHIKR_PHRASE_SLOTS.map((s) => s.hour),
  [8, 10, 12, 14, 16, 18, 20],
  "كل ساعتين من 8 حتى 20",
);
assert.equal(DHIKR_PHRASE_REMINDER_BODY, "اذكر الله");
assert.equal(DHIKR_PHRASE_REMINDER_URL, "/tasbih");
assert.equal(DHIKR_PHRASE_NATIVE_ID_BASE, 9401);

const nativeIds = allDhikrPhraseNativeIds().map((x) => x.id);
assert.deepEqual(
  nativeIds,
  [9401, 9402, 9403, 9404, 9405, 9406, 9407],
  "معرّفات Capacitor متسلسلة",
);
assert.equal(new Set(nativeIds).size, nativeIds.length, "لا تكرار في المعرّفات");
assert.ok(!nativeIds.includes(QURAN_DAILY_REMINDER_NATIVE_ID), "لا تصادم مع ورد القرآن");
assert.ok(!nativeIds.includes(TEST_NOTIFICATION_NATIVE_ID), "لا تصادم مع إشعار الاختبار");
assert.equal(dhikrPhraseNativeId(0), 9401);
assert.equal(dhikrPhraseTag("subhanallah"), "majalis-dhikr-phrase-subhanallah");

const enabledPrefs = {
  enabled: true,
  flashcardsReminder: false,
  resumeReminder: false,
  prayerReminder: false,
  quranDailyReminder: false,
  adhkarReminder: false,
  dhikrPhraseReminder: true,
  reminderHour: 8,
  reminderMinute: 0,
};

{
  const items = buildDailySmartSchedule({ prefs: enabledPrefs, includeStreakWarn: false });
  const dhikr = items.filter((i) => i.kind === "dhikr");
  assert.equal(dhikr.length, 7, "سبعة تذكيرات ذكر في جدول الويب");
  assert.ok(
    dhikr.every((i) => i.title.length > 0 && i.body === "اذكر الله"),
    "العنوان هو العبارة والجسم ثابت",
  );
  assert.ok(
    dhikr.some((i) => i.title === "سبحان الله") && dhikr.some((i) => i.title === "الحمد لله"),
    "يشمل سبحان الله والحمد لله",
  );
  assert.ok(dhikr.every((i) => i.url === "/tasbih"), "النقر يفتح المسبحة");
}

{
  const items = buildDailySmartSchedule({
    prefs: { ...enabledPrefs, dhikrPhraseReminder: false },
    includeStreakWarn: false,
  });
  assert.equal(
    items.filter((i) => i.kind === "dhikr").length,
    0,
    "لا تذكير ذكر عند تعطيل المفتاح",
  );
}

{
  const items = buildDailySmartSchedule({
    prefs: { ...enabledPrefs, enabled: false },
    includeStreakWarn: false,
  });
  assert.equal(items.length, 0, "المفتاح الرئيسي يعطّل الجدول");
}

console.log("dhikr-phrase-reminders: all checks passed");
