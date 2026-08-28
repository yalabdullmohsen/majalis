/**
 * بوابة: شاشة البداية — هوية واضحة بلا لوحة مكررة.
 * node --import tsx src/lib/__tests__/home-brand-hero.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const home = readFileSync(resolve(root, "src/pages/account/ui/HomeView.tsx"), "utf8");
const startCss = readFileSync(resolve(root, "src/styles/components/home/home-start.css"), "utf8");

let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

console.log("\n=== شاشة البداية — هوية Majlisilm ===");
assert(!home.includes("PageHero"), "HomeView بلا PageHero القديم");
assert(!home.includes("HomeBrandTitle"), "HomeView بلا HomeBrandTitle");
assert(home.includes("mj-home-start__title"), "عنوان التطبيق في الشعار");
assert(home.includes("المجلس العلمي"), "اسم التطبيق");
assert(home.includes("علم نافع، محتوى موثوق، ودروس ميسرة"), "وصف قصير");
assert(home.includes("StartHeader"), "هيدر البداية");
assert(home.includes("PrayerSummaryCard"), "بطاقة مواقيت الصلاة");
assert(home.includes("DhikrSummaryCard"), "بطاقة الأذكار");
assert(home.includes("HomeFeaturedSections"), "أقسام بارزة");
assert(startCss.includes("--mj-start-brand: #19815f"), "الأخضر الرئيسي");
assert(startCss.includes("border-radius: 24px"), "حواف ناعمة");
assert(!startCss.includes("min-height: unset"), "لا إلغاء حجز الارتفاع");

if (failed) process.exit(1);
console.log("home-brand-hero.test.ts: ok");
