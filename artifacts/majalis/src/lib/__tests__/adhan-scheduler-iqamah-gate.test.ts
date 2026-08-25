/**
 * بوابة جدولة الأذان/الإقامة: بلا مدينة، جيل مؤقتات، تفضيلات لكل صلاة.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-scheduler-iqamah-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isIqamahEnabledForPrayer,
  loadAdhanPrefs,
  patchAdhanPrefs,
  patchPrayerPrefs,
} from "../adhan-preferences";
import { SELECTABLE_ADHAN_TYPES } from "../adhan-selectable-types";
import { getMuezzin } from "../adhan-audio";
import { resolveIqamahClip } from "../adhan-playback-modes";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const scheduler = readFileSync(resolve(root, "src/lib/adhan-scheduler.ts"), "utf8");
const sw = readFileSync(resolve(root, "public/sw.js"), "utf8");
const audio = readFileSync(resolve(root, "src/lib/adhan-audio.ts"), "utf8");

assert.match(scheduler, /_scheduleGen/);
assert.match(scheduler, /isIqamahEnabledForPrayer/);
assert.match(scheduler, /playIqamah/);
assert.match(scheduler, /SCHEDULE_IQAMAH/);
assert.match(scheduler, /CANCEL_ALL_ADHAN/);
assert.match(scheduler, /cancelAndroidFullAdhan/);
assert.doesNotMatch(scheduler, /madinah/);

assert.match(sw, /CANCEL_ALL_ADHAN/);
assert.match(sw, /SCHEDULE_IQAMAH/);
assert.match(sw, /_iqamahTimers/);

assert.doesNotMatch(audio, /id:\s*"madinah"/);
assert.equal(SELECTABLE_ADHAN_TYPES.every((t) => t.muezzinId === "makkah"), true);

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
};

mem.clear();
patchAdhanPrefs({ iqamahEnabled: true, iqamahDelayMinutes: 10 });
for (const key of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
  patchPrayerPrefs(key, { enabled: true, iqamahEnabled: true });
}
const prefs = loadAdhanPrefs();
for (const key of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
  assert.equal(isIqamahEnabledForPrayer(prefs, key), true, key);
}
patchPrayerPrefs("isha", { iqamahEnabled: false });
assert.equal(isIqamahEnabledForPrayer(loadAdhanPrefs(), "isha"), false);

const makkah = getMuezzin("makkah");
const clip = resolveIqamahClip(makkah);
assert.ok(clip, "الإقامة لها مقطع افتراضي (تكبيرات)");
assert.equal(getMuezzin("madinah").id, "makkah", "ترحيل المدينة → مكة");

console.log("adhan-scheduler-iqamah-gate.test.ts: ok");
