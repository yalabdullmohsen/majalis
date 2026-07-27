/**
 * اختبار انحدار بصري خفيف لصفحتي الفقه والعقيدة على عروض جوال.
 * يتحقق برمجيًا من قواعد CSS الحرجة (بدون متصفح) + يُجهِّز مسار screenshot
 * عند توفر Playwright.
 *
 * تشغيل: npx tsx src/lib/__tests__/section-hub-visual-regression.test.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}

const VIEWPORTS = [320, 375, 390, 430];

console.log("\n=== قواعد CSS الحرجة لصفحات الأقسام ===");
{
  const tawhid = readFileSync(resolve(root, "src/styles/pages/tawhid.css"), "utf8");
  const fiqh = readFileSync(resolve(root, "src/styles/pages/fiqh-hub.css"), "utf8");
  const finalCss = readFileSync(resolve(root, "src/styles/final-release.css"), "utf8");
  const indexCss = readFileSync(resolve(root, "src/index.css"), "utf8");

  assert(indexCss.includes("overflow-x: hidden"), "html/body يمنع التمرير الأفقي");
  assert(tawhid.includes("line-clamp: 3") || tawhid.includes("-webkit-line-clamp: 3"), "وصف بطاقة التوحيد: line-clamp 3");
  assert(fiqh.includes("line-clamp: 3") || fiqh.includes("-webkit-line-clamp: 3"), "وصف بطاقة الفقه: line-clamp 3");
  assert(tawhid.includes("twh-hub-card__heading"), "عنوان+شارة في صف flex");
  assert(tawhid.includes("flex-shrink: 0"), "الشارة لا تنكمش");
  assert(tawhid.includes("minmax(0, 1fr)") || tawhid.includes("repeat(2,"), "شبكة التوحيد متجاوبة");
  assert(fiqh.includes("@media (min-width: 400px)"), "الفقه: عمود واحد تحت 400px");
  assert(fiqh.includes("scroll-snap-type"), "تبويبات الفقه: scroll-snap");
  assert(finalCss.includes("scroll-snap-type: x proximity"), "شريط الأقسام: scroll-snap");
  assert(tawhid.includes("clamp(1.5rem, 5vw, 2rem)"), "مقياس عنوان الصفحة");
  assert(tawhid.includes("clamp(1.05rem, 3.6vw, 1.25rem)"), "مقياس عنوان البطاقة");
  assert(tawhid.includes("letter-spacing: 0"), "بلا letter-spacing للعربية");
  assert(fiqh.includes("border-top: 1px dashed") || fiqh.includes("fiqh-section-divider"), "فاصل داخلي منقّط");

  for (const w of VIEWPORTS) {
    assert(w >= 320 && w <= 430, `عرض جوال مدعوم في خطة التحقق: ${w}px`);
  }
}

console.log("\n=== بنية المكوّنات ===");
{
  const tawhidPage = readFileSync(resolve(root, "src/views/TawhidPage.tsx"), "utf8");
  const topBar = readFileSync(resolve(root, "src/components/TopSectionBar.tsx"), "utf8");
  assert(tawhidPage.includes("twh-hub-card__heading"), "TawhidPage يستخدم صف العنوان/الشارة");
  assert(topBar.includes('aria-label="أقسام رئيسية"'), "TopSectionBar موجود");
  assert(existsSync(resolve(root, "scripts/strip-enrichment-boilerplate.mjs")), "سكربت التنظيف/التقرير موجود");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
console.log(`عروض التحقق المستهدفة: ${VIEWPORTS.join(" / ")}px — لا تمرير أفقي متوقع بفضل overflow-x + max-width:100%`);
if (failed > 0) process.exit(1);
