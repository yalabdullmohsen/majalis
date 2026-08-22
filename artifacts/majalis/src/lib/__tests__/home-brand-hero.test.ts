/**
 * بوابة: هيرو الترحيب = التحية مباشرة بلا «المجلس العلمي» المكرر.
 * node --import tsx src/lib/__tests__/home-brand-hero.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const home = readFileSync(resolve(root, "src/pages/account/ui/HomeView.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/components/home-brand-title.css"), "utf8");

let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

console.log("\n=== هيرو الترحيب بدون هوية مكررة ===");
assert(!home.includes("HomeBrandTitle"), "HomeView بلا HomeBrandTitle");
assert(home.includes("علم شرعي موثوق في مكان واحد"), "عنوان البطاقة الرئيسية واضح");
assert(home.includes("تصفح الأقسام"), "زر ثانوي لتصفح الأقسام");
assert(!home.includes('title="المجلس العلمي"'), "لا تكرار لشعار الهيدر داخل البطاقة");
assert(!/title=\{<\s*HomeBrandTitle/.test(home), "لا عنوان هوية داخل البطاقة");
assert(css.includes("home-page-hero"), "أنماط الهيرو المدمجة");
assert(!css.includes("home-brand-title__panel"), "لا لوحة زخرفية للهوية في البطاقة");
assert(!/min-height:\s*clamp\(11\.5rem,\s*33dvh/.test(css), "لا ارتفاع ثلث شاشة زائد");
assert(!/min-height:\s*unset/.test(css), "لا إلغاء حجز ارتفاع الهيرو بعد الرسم");
assert(/min-height:\s*11rem/.test(css), "ارتفاع الهيرو يطابق CSS الحرج");

if (failed) process.exit(1);
console.log("home-brand-hero.test.ts: ok");
