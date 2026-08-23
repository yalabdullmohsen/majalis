/**
 * بوابة واجهة إعدادات الأذان: أربعة أنواع، اختبار واحد، بلا تشخيص أو خيارات وهمية.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-settings-ui.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SELECTABLE_ADHAN_TYPES } from "../adhan-selectable-types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const css = readFileSync(resolve(appRoot, "src/styles/pages/adhan-settings.css"), "utf8");
const view = readFileSync(resolve(appRoot, "src/pages/worship/ui/AdhanSettingsView.tsx"), "utf8");
const alerts = readFileSync(resolve(appRoot, "src/components/adhan/PrayerAlertSettingsCard.tsx"), "utf8");

assert.match(css, /\.ads-toggle\s*\{[\s\S]*?height:\s*31px\s*!important/);
assert.match(css, /\.ads-toggle\s*\{[\s\S]*?width:\s*51px\s*!important/);
assert.match(css, /\.ads-toggle__thumb/);
assert.match(css, /inset-inline-start/);
assert.match(css, /\.ads-chip\s*\{[\s\S]*?height:\s*36px/);
assert.match(css, /\.ads-chip-scroll/);
assert.match(css, /\.ads-toast/);
assert.match(css, /padding-bottom:\s*calc\(5\.5rem \+ var\(--inset-bottom/);
assert.equal(/env\(safe-area/.test(css), false, "بلا env(safe-area) — استخدم --inset-*");
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /\.ads-style-grid/);
assert.match(css, /\.ads-style-card/);
assert.match(css, /\.ads-prayer-row__top/);

const typesSrc = readFileSync(resolve(appRoot, "src/lib/adhan-selectable-types.ts"), "utf8");

assert.match(view, /إعدادات الأذان/);
assert.match(view, /اختيار الأذان/);
assert.match(view, /SELECTABLE_ADHAN_TYPES/);
assert.match(view, /t\.label/);
assert.match(view, /اختبار الصوت/);
assert.match(view, /اختبار إشعار بعد ١٥ ثانية/);
assert.match(view, /فحص حالة الأذان/);
assert.match(view, /إشعار النظام صوت قصير/);
assert.match(view, /تخصيص كل صلاة/);
assert.match(view, /إعادة جدولة التنبيهات/);
assert.match(view, /إذن الإشعارات/);
assert.match(view, /إذن الموقع/);
assert.match(view, /حالة الصوت/);
assert.match(view, /playAdhanPreview/);
assert.match(view, /ads-prayer-row/);
assert.match(view, /rounded-full icon-only/);

assert.match(typesSrc, /أذان مكة كامل/);
assert.match(typesSrc, /أذان المدينة كامل/);
assert.match(typesSrc, /أذان مكة مختصر/);
assert.match(typesSrc, /أذان المدينة مختصر/);
assert.match(typesSrc, /hint:/);
assert.match(view, /selectedType\.hint/);

assert.match(alerts, /تفعيل إشعارات الصلاة/);
assert.match(alerts, /تنبيه قبل الصلاة/);
assert.match(alerts, /مدة التنبيه قبل الصلاة/);
assert.match(alerts, /تنبيه دخول الوقت/);

const forbiddenCopy = [
  "تجاوز التركيز",
  "Focus",
  "Silent Mode",
  "Do Not Disturb",
  "تجاوز الصامت",
  "Critical Alerts",
  "تفاصيل iOS",
  "نسخ تقرير التشخيص",
  "تشغيل الأذان المتتابع",
  "تحميل النسخ الكاملة",
  "اختبار الأذان الكامل",
  "اختبار الأذان المختصر",
  "الأقصى",
  "تكبيرات",
  "تنبيه لطيف",
  "إشعار نصي",
  "أذان متتابع",
  "Live Activity",
];
const leaked = forbiddenCopy.filter((text) => view.includes(text) || alerts.includes(text));
if (leaked.length > 0) {
  throw new Error(`نصوص محظورة ظهرت في واجهة الأذان: ${leaked.join("، ")}`);
}

assert.equal(SELECTABLE_ADHAN_TYPES.length, 4);
const ids = SELECTABLE_ADHAN_TYPES.map((t) => t.id);
assert.deepEqual(ids, ["makkah-full", "madinah-full", "makkah-short", "madinah-short"]);

for (const t of SELECTABLE_ADHAN_TYPES) {
  const rel = t.inAppUrl.replace(/^\//, "");
  assert.ok(existsSync(resolve(appRoot, "public", rel)), `ملف داخل التطبيق مفقود: ${t.inAppUrl}`);
  assert.ok(
    existsSync(resolve(appRoot, "ios/App/App/Sounds", t.notificationSound)),
    `ملف إشعار iOS مفقود: ${t.notificationSound}`,
  );
}

console.log("adhan-settings-ui.test.ts: ok");
