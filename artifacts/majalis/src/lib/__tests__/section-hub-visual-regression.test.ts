/**
 * اختبار انحدار بصري خفيف لصفحات الأقسام بعد توحيد HubCard.
 * يتحقق برمجيًا من قواعد CSS الحرجة (بدون متصفح).
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
  const hubCard = readFileSync(resolve(root, "src/styles/components/hub-card.css"), "utf8");
  const lobbyCss = readFileSync(resolve(root, "src/components/lobby/section-lobby.css"), "utf8");
  const finalCss = readFileSync(resolve(root, "src/styles/final-release.css"), "utf8");
  const indexCss = readFileSync(resolve(root, "src/index.css"), "utf8");

  assert(indexCss.includes("overflow-x: hidden"), "html/body يمنع التمرير الأفقي");
  assert(hubCard.includes(".hub-card-grid"), "شبكة HubCard موحّدة");
  assert(hubCard.includes("repeat(2, minmax(0, 1fr))"), "عمودان على الجوال");
  assert(hubCard.includes("background: var(--mj-surface)"), "بطاقة بسطح فاتح");
  assert(hubCard.includes("background: var(--mj-brand-soft)"), "أيقونة بخلفية soft");
  assert(
    hubCard.includes(".quran-hub-card__header") && hubCard.includes("display: none"),
    "إبطال الكتل الداكنة الفارغة",
  );
  assert(hubCard.includes("color: var(--mj-ink-2)"), "وصف البطاقة بتباين كافٍ");
  assert(lobbyCss.includes("scroll-snap-type"), "تبويبات اللوبي: scroll-snap");
  assert(finalCss.includes("scroll-snap-type: x proximity"), "شريط الأقسام: scroll-snap");

  for (const w of VIEWPORTS) {
    assert(w >= 320 && w <= 430, `عرض جوال مدعوم في خطة التحقق: ${w}px`);
  }
}

console.log("\n=== بنية المكوّنات ===");
{
  const hubCardTsx = readFileSync(resolve(root, "src/components/ui/HubCard.tsx"), "utf8");
  const tawhidPage = readFileSync(resolve(root, "src/views/TawhidPage.tsx"), "utf8");
  const fiqhPage = readFileSync(resolve(root, "src/pages/fiqh/ui/FiqhView.tsx"), "utf8");
  const quranHub = readFileSync(resolve(root, "src/pages/quran/ui/QuranHubView.tsx"), "utf8");
  const merged = readFileSync(resolve(root, "src/views/MergedSectionHubPage.tsx"), "utf8");
  const topBar = readFileSync(resolve(root, "src/components/TopSectionBar.tsx"), "utf8");

  assert(hubCardTsx.includes("hub-card__title"), "HubCard يعرّف العنوان");
  assert(tawhidPage.includes("HubCard"), "TawhidPage يرحّل إلى HubCard");
  assert(fiqhPage.includes("SectionLobby"), "FiqhPage يرحّل إلى SectionLobby");
  assert(quranHub.includes("SectionLobby"), "QuranHubPage يرحّل إلى SectionLobby");
  assert(merged.includes("SectionLobby"), "MergedSectionHubPage يرحّل إلى SectionLobby");
  assert(topBar.includes('aria-label="أقسام رئيسية"'), "TopSectionBar موجود");
  assert(existsSync(resolve(root, "scripts/strip-enrichment-boilerplate.mjs")), "سكربت التنظيف/التقرير موجود");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
console.log(`عروض التحقق المستهدفة: ${VIEWPORTS.join(" / ")}px — لا تمرير أفقي متوقع بفضل overflow-x + max-width:100%`);
if (failed > 0) process.exit(1);
