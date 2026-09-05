/**
 * بوابة: هيرو الترحيب = هوية + تحية، بلا لوحة مكررة وبلا min-height:unset.
 * node --import tsx src/lib/__tests__/home-brand-hero.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const home = readFileSync(resolve(root, "src/pages/account/ui/HomeView.tsx"), "utf8");
const hero = readFileSync(resolve(root, "src/components/home/HomeHeroLcp.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/components/home-brand-title.css"), "utf8");
const wordmark = readFileSync(resolve(root, "src/components/brand/MajlisWordmark.tsx"), "utf8");

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
assert(hero.includes("greeting"), "التحية ظاهرة في الهيرو الثابت");
assert(hero.includes('title="سُنّة"') || hero.includes("title=\"سُنّة\""), "اسم التطبيق عنوان الهيرو");
assert(hero.includes("تصفح الأقسام"), "زر ثانوي لتصفح الأقسام");
assert(!home.includes("<PageHero"), "الهيرو ليس مكرراً داخل HomeView");
assert(css.includes("home-page-hero"), "أنماط الهيرو المدمجة");
assert(!css.includes("home-brand-title__panel"), "لا لوحة زخرفية للهوية في البطاقة");
assert(!/min-height:\s*clamp\(11\.5rem,\s*33dvh/.test(css), "لا ارتفاع ثلث شاشة زائد");
assert(!/min-height:\s*unset/.test(css), "لا إلغاء حجز ارتفاع الهيرو");
assert(/min-height:\s*11rem/.test(css), "ارتفاع الهيرو محجوز");
assert(/width\s*\?\?\s*138/.test(wordmark), "عرض SVG Intrinsic يحجز قبل CSS");
assert(/height\s*\?\?\s*33/.test(wordmark), "ارتفاع SVG Intrinsic يحجز قبل CSS");

if (failed) process.exit(1);
console.log("home-brand-hero.test.ts: ok");
