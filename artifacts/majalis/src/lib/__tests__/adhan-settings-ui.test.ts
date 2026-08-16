/**
 * بوابة واجهة إعدادات الأذان: مفتاح قياسي، شرائح، تنظيم، شيت مؤذن.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-settings-ui.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const css = readFileSync(resolve(appRoot, "src/styles/pages/adhan-settings.css"), "utf8");
const view = readFileSync(resolve(appRoot, "src/pages/worship/ui/AdhanSettingsView.tsx"), "utf8");
const picker = readFileSync(resolve(appRoot, "src/components/adhan/MuezzinPicker.tsx"), "utf8");
const pickerCss = readFileSync(resolve(appRoot, "src/styles/components/muezzin-picker.css"), "utf8");

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

assert.match(view, /الأذان العام|الإعداد العام/);
assert.match(view, /PrayerCustomizeSheet|ads-sheet/);
assert.match(view, /ads-prayer-row/);
assert.match(view, /rounded-full icon-only/);
assert.equal(view.split("(افتراضي)").length - 1, 1, "وسم (افتراضي) مرة واحدة في الإعداد العام فقط");
assert.equal(view.includes("النسبة الشخصية لا تُعرض إلا بعد التثبّت"), false);
assert.match(view, /اختبار الأذان الكامل/);
assert.match(view, /اختبار الأذان الآن/);
assert.match(view, /إعادة جدولة التنبيهات/);
assert.match(view, /أنواع الأذان/);
assert.match(view, /تجربة الصوت/);
assert.match(view, /تذكير أذكار الصباح والمساء/);
assert.match(view, /اختبار إشعار قصير بعد 15 ثانية/);
assert.match(view, /اختبار الأذان المتتابع/);
assert.match(view, /أذان متتابع تجريبي/);
assert.match(view, /يتطلب موافقة Critical Alerts من Apple/);
assert.match(view, /صيغة التشغيل:/);
assert.match(css, /\.ads-style-grid/);
assert.match(css, /\.ads-style-card/);

assert.match(picker, /mzp-search/);
assert.match(picker, /mzp-progress/);
assert.match(picker, /mzp-close|mzp-footer/);
assert.equal(picker.includes("النسبة الشخصية لا تُعرض إلا بعد التثبّت"), false);

assert.match(pickerCss, /max-height:\s*70vh/);
assert.match(pickerCss, /\.mzp-preview-btn--playing\s*\{[\s\S]*?--msk-text/);
assert.equal(/#C1595A|msk-red/.test(pickerCss), false, "زر الإيقاف بلا أحمر خارج الثيم");
assert.equal(/#60A5FA|#A78BFA/.test(pickerCss), false, "بلا ألوان زرقاء/بنفسجية خارج الثيم");

console.log("adhan-settings-ui.test.ts: ok");
