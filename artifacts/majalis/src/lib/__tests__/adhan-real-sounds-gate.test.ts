/**
 * بوابة: أصوات إشعار حقيقية + أذان معاينة + فصل الأدوار في الإعدادات.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-real-sounds-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  listAvailableSettingsSounds,
  listExpectedIosNotificationCafs,
  listExpectedSettingsSoundFiles,
} from "../adhan-settings-sound-catalog";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const view = read("src/pages/worship/ui/AdhanSettingsView.tsx");
const catalog = read("src/lib/adhan-settings-sound-catalog.ts");
const prompts = read("src/components/adhan/AudioPromptsSettingsCard.tsx");

assert.match(view, /معاينة/);
assert.doesNotMatch(view, />استماع</);
assert.match(view, /الأذان داخل التطبيق/);
assert.match(view, /صوت إشعار الصلاة/);
assert.match(view, /اختبار إشعار خلال ١٠ ثوانٍ|اختبار الإشعار بعد ١٠ ثوانٍ/);
assert.match(view, /fireTestLocalNotification\(10_000\)/);
assert.doesNotMatch(view, /أذان مصري|أذان تركي|أذان حجازي|أذان سعودي رسمي|تسجيل ثان/);
assert.doesNotMatch(view, /\bcaf\b|\bm4a\b|إشعارات متتابعة|أذان كامل كإشعار/i);
assert.doesNotMatch(view, /بانتظار تسجيل مرخّص/);
assert.doesNotMatch(prompts, /بانتظار تسجيل مرخّص/);

assert.match(catalog, /adhan-makkah\.mp3/);
assert.match(catalog, /adhan-gulf-short\.mp3/);
assert.match(catalog, /prayer-alert\.mp3/);
assert.match(catalog, /alarm-clear\.mp3/);
assert.doesNotMatch(catalog, /adhan-madinah\.mp3|adhan-qatami\.mp3/);

const options = listAvailableSettingsSounds();
assert.ok(options.some((o) => o.group === "adhan" && o.id === "makkah"));
assert.ok(options.some((o) => o.group === "adhan" && o.id === "kuwait"));
assert.ok(!options.some((o) => o.id === "madinah"), "madinah غير معتمد للإنتاج");
assert.ok(!options.some((o) => o.id === "qatami"), "qatami محظور");
assert.ok(options.some((o) => o.group === "tone" && o.id === "tone-prayer"));
assert.ok(options.some((o) => o.id === "silent"));

for (const rel of listExpectedSettingsSoundFiles()) {
  const abs = resolve(root, "public" + rel);
  assert.ok(existsSync(abs), `missing ${rel}`);
  assert.ok(statSync(abs).size > 2000, `too small ${rel}`);
}

for (const caf of listExpectedIosNotificationCafs()) {
  const abs = resolve(root, "ios/App/App/Sounds", caf);
  assert.ok(existsSync(abs), `missing ios caf ${caf}`);
  assert.ok(statSync(abs).size > 1000, `too small caf ${caf}`);
}

console.log("adhan-real-sounds-gate.test.ts: ok");
