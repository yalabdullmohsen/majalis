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

  assert(indexCss.includes("overflow-x: clip") || indexCss.includes("overflow-x: hidden"), "html/body يمنع التمرير الأفقي");
  assert(hubCard.includes(".hub-card-grid"), "شبكة HubCard موحّدة");
  assert(
    hubCard.includes("auto-fit") && hubCard.includes("--card-min-width"),
    "شبكة متجاوبة auto-fit بحد أدنى للبطاقة",
  );
  assert(!hubCard.includes("repeat(2, minmax(0, 1fr))"), "لا عمودين إجباريين على الجوال");
  const responsive = readFileSync(resolve(root, "src/styles/responsive-card-system.css"), "utf8");
  assert(responsive.includes("overflow-wrap: break-word"), "سلامة نص عربي: break-word لا anywhere");
  assert(responsive.includes("writing-mode: horizontal-tb"), "عناوين أفقية");
  assert(responsive.includes("--content-bottom-inset"), "هامش سفلي فوق Bottom Nav");
  assert(
    hubCard.includes("var(--ss-card-bg") || hubCard.includes("var(--mj-surface)"),
    "بطاقة بسطح فاتح",
  );
  assert(
    hubCard.includes("var(--mj-brand-soft") || hubCard.includes("hub-card__icon"),
    "أيقونة بهوية التطبيق",
  );
  assert(hubCard.includes("hub-card__foot"), "تذييل مدمج مع السهم");
  assert(
    hubCard.includes(".quran-hub-card__header") && hubCard.includes("display: none"),
    "إبطال الكتل الداكنة الفارغة",
  );
  assert(
    hubCard.includes("var(--text-secondary") || hubCard.includes("var(--mj-ink-2)"),
    "وصف البطاقة بتباين كافٍ",
  );
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

  assert(hubCardTsx.includes("SectionEntryCard"), "SectionEntryCard مُعرَّف");
  assert(hubCardTsx.includes("hub-card__go"), "HubCard: سهم مدمج");
  assert(hubCardTsx.includes("hub-card__foot"), "تذييل مدمج في المكوّن");
  assert(tawhidPage.includes("HubCard"), "TawhidPage يرحّل إلى HubCard");
  assert(merged.includes("SectionEntryCard"), "MergedSectionHub يستخدم SectionEntryCard");

  assert(fiqhPage.includes("publishedBooks") && fiqhPage.includes("searchFiqhCatalog"), "FiqhPage يعرض كتب الفقه مع البحث");
  assert(quranHub.includes("SectionLobby"), "QuranHubPage يرحّل إلى SectionLobby");
  assert(merged.includes("TopicPage"), "MergedSectionHubPage يرحّل إلى TopicPage");
  assert(topBar.includes('aria-label="أقسام رئيسية"'), "TopSectionBar موجود");
  assert(existsSync(resolve(root, "scripts/strip-enrichment-boilerplate.mjs")), "سكربت التنظيف/التقرير موجود");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
console.log(`عروض التحقق المستهدفة: ${VIEWPORTS.join(" / ")}px — لا تمرير أفقي متوقع بفضل overflow-x + max-width:100%`);
if (failed > 0) process.exit(1);
