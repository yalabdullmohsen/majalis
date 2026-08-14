/**
 * بوابة: زخرفة هوية المجلس في هيرو الرئيسية (ثلث الشاشة + خط زخرفي).
 * تشغيل: node --import tsx src/lib/__tests__/home-brand-hero.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const home = readFileSync(resolve(root, "src/pages/account/ui/HomeView.tsx"), "utf8");
const brand = readFileSync(resolve(root, "src/components/home/HomeBrandTitle.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/components/home-brand-title.css"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");

let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

console.log("\n=== هيرو هوية المجلس ===");
assert(home.includes("HomeBrandTitle"), "HomeView يستخدم HomeBrandTitle");
assert(home.includes('className="m2030-hero home-page-hero"'), "صنف هيرو الرئيسية");
assert(brand.includes("المجلس العلمي"), "نص الهوية");
assert(brand.includes("data-majlis-brand"), "علامة هوية");
assert(/33dvh|33vh/.test(css), "ارتفاع نحو ثلث الشاشة");
assert(css.includes("Aref Ruqaa"), "خط زخرفي للعنوان");
assert(css.includes("home-brand-title__panel"), "لوحة زخرفية");
assert(/Aref\+Ruqaa|Aref%20Ruqaa/.test(html), "تحميل خط Aref Ruqaa");

if (failed > 0) process.exit(1);
console.log("home-brand-hero: ok");
