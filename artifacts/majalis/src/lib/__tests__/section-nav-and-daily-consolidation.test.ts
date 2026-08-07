/**
 * اختبار Regression للتنقل بعد تنظيف الأقسام (2026-08).
 * تُشغَّل عبر: npx tsx src/lib/__tests__/section-nav-and-daily-consolidation.test.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { isTabActive, SECTION_TABS } from "../../components/TopSectionBar";
import { HOME_WIDGET_DEFS, sanitizePrefs, type HomeWidgetId } from "../homepage-layout";
import { FEATURE_REGISTRY } from "../feature-registry";
import {
  HIDDEN_FROM_NAV_PATHS,
  MERGED_PATH_REDIRECTS,
  filterNavItems,
  isComingSoonPath,
  resolveMergedPath,
} from "../nav-visibility";
import { FEATURE_CATS } from "../home-feature-catalog";
import { PRIMARY_NAV_ITEMS } from "../navigation";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ FAIL: ${label}`); failed++; }
}

console.log("\n=== TopSectionBar — مساحات موحّدة ===");
{
  assert(SECTION_TABS.length === 4, `4 مساحات في الشريط العلوي (الفعلي: ${SECTION_TABS.length})`);
  const hrefs = SECTION_TABS.map((t) => t.href);
  const labels = SECTION_TABS.map((t) => t.label);
  assert(new Set(hrefs).size === hrefs.length, "لا تكرار في مسارات الأقسام");
  assert(hrefs.includes("/quran-knowledge") && labels.includes("قرآن"), "مساحة قرآن");
  assert(hrefs.includes("/lessons") && labels.includes("الدروس"), "مساحة الدروس");
  assert(hrefs.includes("/prayer-times") && labels.includes("الصلاة"), "مساحة الصلاة");
  assert(hrefs.includes("/fiqh") && labels.includes("فقه"), "مساحة فقه");
  assert(!hrefs.includes("/library"), "المكتبة خارج الشريط");
  assert(!hrefs.includes("/mushaf"), "المصحف خارج الشريط أثناء قريبًا");
}

console.log("\n=== isTabActive ===");
{
  assert(isTabActive("/mushaf", "/quran-knowledge") === true, "المصحف تحت قرآن");
  assert(isTabActive("/ulum-quran", "/quran-knowledge") === true, "علوم القرآن تحت قرآن");
  assert(isTabActive("/quran/surah-stories", "/quran-knowledge") === true, "قصص السور تحت قرآن");
  assert(isTabActive("/hadith", "/lessons") === true, "الحديث تحت الدروس");
  assert(isTabActive("/adhkar", "/prayer-times") === true, "الأذكار تحت الصلاة");
  assert(isTabActive("/qa", "/fiqh") === true, "الأسئلة تحت فقه");
  assert(isTabActive("/library/book-1", "/quran-knowledge") === false, "مسار كتاب لا يفعّل قرآن");
}

console.log("\n=== ودجتات الرئيسية ===");
{
  const ids = HOME_WIDGET_DEFS.map((w) => w.id);
  assert(!ids.includes("library" as HomeWidgetId), "ودجت المكتبة أُزيل");
  assert(!ids.includes("latest-updates" as HomeWidgetId), "ودجت آخر التحديثات أُزيل");
  assert(!ids.includes("hadith" as HomeWidgetId), "hadith اليومي ما زال محذوفاً");
  const cleaned = sanitizePrefs({ order: ["library", "latest-updates", "continue"], hidden: ["library"] });
  assert(!cleaned.order.includes("library" as HomeWidgetId), "تفضيل مكتبة قديم يُصفَّى");
  assert(cleaned.order.includes("continue" as HomeWidgetId), "continue يبقى");
  assert(cleaned.order.length === HOME_WIDGET_DEFS.length, "الترتيب يكتمل بكل الودجتات الحالية");
}

console.log("\n=== سجل الميزات ===");
{
  const entry = FEATURE_REGISTRY.find((f) => f.id === "scholarly-research");
  assert(entry?.status === "disabled", "الباحث الشرعي معطّل");
  assert(HIDDEN_FROM_NAV_PATHS.has("/universities"), "universities مخفي");
}

console.log("\n=== vercel redirects للتنظيف ===");
{
  const vercelConfig = JSON.parse(readFileSync(resolve(appRoot, "vercel.json"), "utf-8"));
  const redirects = vercelConfig.redirects as Array<{ source: string; destination: string; permanent: boolean }>;
  const expect: Array<[string, string]> = [
    ["/library", "/"],
    ["/updates", "/"],
    ["/knowledge-graph", "/"],
    ["/academic-research", "/"],
    ["/quran-index", "/quran-knowledge"],
    ["/memorization-tests", "/memorization"],
    ["/islamic-institutions", "/islamic-directory"],
    ["/reviewed-cards", "/my-learning"],
    ["/learning-plan", "/learning/paths"],
    ["/quran-studies", "/quran-knowledge"],
  ];
  for (const [source, destination] of expect) {
    const rule = redirects.find((r) => r.source === source);
    assert(!!rule && rule.destination === destination && rule.permanent === true,
      `توجيه ${source} → ${destination}`);
  }
}

console.log("\n=== PRIMARY_NAV ===");
{
  const hrefs = PRIMARY_NAV_ITEMS.map((i) => i.href);
  assert(hrefs.includes("/") && hrefs.includes("/quran-knowledge") && hrefs.includes("/fiqh"), "هيدر أساسي");
  assert(hrefs.includes("/lessons") && hrefs.includes("/prayer-times"), "الدروس والصلاة في PRIMARY_NAV");
  assert(!hrefs.includes("/library"), "لا مكتبة في PRIMARY_NAV");
  assert(!hrefs.includes("/mushaf"), "المصحف خارج PRIMARY_NAV أثناء قريبًا");
}

console.log("\n=== nav-visibility تنظيف ===");
{
  for (const p of ["/library", "/updates", "/knowledge-graph", "/academic-research", "/flashcards", "/ulum-quran", "/occasions", "/institutions"]) {
    assert(HIDDEN_FROM_NAV_PATHS.has(p), `${p} مخفي من الاكتشاف`);
  }
  assert(resolveMergedPath("/library") === "/", "library → /");
  assert(resolveMergedPath("/quran-index") === "/quran-knowledge", "quran-index → hub");
  assert(resolveMergedPath("/reviewed-cards") === "/my-learning", "reviewed-cards → حسابي");
  assert(Object.keys(MERGED_PATH_REDIRECTS).length >= 10, "جدول التوجيه غير فارغ");
  assert(isComingSoonPath("/kids"), "الأطفال قريبًا");
  assert(isComingSoonPath("/mushaf"), "المصحف قريبًا مؤقتًا");
  assert(isComingSoonPath("/mushaf/1"), "مسارات المصحف الفرعية قريبًا");

  const homeHrefs = FEATURE_CATS.flatMap((c) => c.items.map((i) => i.href));
  assert(!homeHrefs.includes("/library") && !homeHrefs.includes("/flashcards"), "الكتالوج بلا مكتبة/بطاقات منفصلة");
  assert(homeHrefs.includes("/quran-knowledge") && homeHrefs.includes("/memorization"), "البوابات في الكتالوج");
  assert(filterNavItems([{ href: "/library" }, { href: "/mushaf" }]).map((i) => i.href).join(",") === "/mushaf",
    "filterNavItems يسقط المكتبة");
}

console.log("\n=== القوائم بلا أقسام محذوفة — عن المجلس في المصدر الموحّد ===");
{
  const moreSrc = readFileSync(resolve(appRoot, "src/components/MoreBottomSheet.tsx"), "utf-8");
  const sideSrc = readFileSync(resolve(appRoot, "src/components/SideNavDrawer.tsx"), "utf-8");
  const sidebarNavSrc = readFileSync(resolve(appRoot, "src/lib/sidebar-nav.ts"), "utf-8");
  const servicesNavSrc = readFileSync(resolve(appRoot, "src/lib/services-center-nav.ts"), "utf-8");
  const navMapSrc = readFileSync(resolve(appRoot, "src/lib/nav-map.ts"), "utf-8");
  const homeSrc = readFileSync(resolve(appRoot, "src/pages/account/ui/HomeView.tsx"), "utf-8");
  const footerSrc = readFileSync(resolve(appRoot, "src/components/SiteFooter.tsx"), "utf-8");
  const appSrc = readFileSync(resolve(appRoot, "src/App.tsx"), "utf-8");
  for (const src of [moreSrc, sideSrc, sidebarNavSrc, servicesNavSrc]) {
    assert(!src.includes('href: "/library"') && !src.includes('"/library"'), "لا رابط مكتبة قديم /library");
    assert(!src.includes('"/updates"'), "لا آخر المستجدات");
    assert(!src.includes('"/knowledge-graph"'), "لا استكشف المعرفة");
    assert(!src.includes('"/academic-research"'), "لا بحث علمي");
  }
  assert(!homeSrc.includes("HomeAboutSection"), "من نحن خارج الرئيسية");
  const footerNavSrc = readFileSync(resolve(appRoot, "src/lib/site-footer-nav.ts"), "utf-8");
  assert(footerSrc.includes("SITE_FOOTER_GROUPS") || footerSrc.includes("site-footer-nav"), "التذييل من مصدر المجموعات");
  assert(footerNavSrc.includes("/about-us") && footerNavSrc.includes("/privacy"), "تذييل عن المجلس");
  assert(footerNavSrc.includes("/start-here") && footerNavSrc.includes("/learning/paths"), "تذييل ابدأ/مسارات");
  assert(footerNavSrc.includes("SITE_FOOTER_GROUPS") && footerNavSrc.includes("الأقسام"), "تذييل رباعي المجموعات");
  for (const title of ["الأقسام", "ابدأ", "الثقة", "قانوني"]) {
    assert(footerNavSrc.includes(`title: "${title}"`), `مجموعة التذييل: ${title}`);
  }
  assert(!footerNavSrc.includes('title: "استكشف"'), "لا مجموعة خامسة في التذييل");
  for (const href of ["/methodology", "/fatwa-policy", "/about", "/privacy", "/contact"]) {
    assert(footerNavSrc.includes(href), `رابط التذييل: ${href}`);
  }
  assert(appSrc.includes("SiteFooter") && appSrc.includes("{!hideSiteChrome && <SiteFooter />}"), "التذييل في غلاف التطبيق");
  assert(footerNavSrc.includes("الريادة الإسلامية الرقمية"), "سطر الريادة في التذييل");
  assert(servicesNavSrc.includes("/about-us") && servicesNavSrc.includes("/about"), "عن المجلس في مركز الخدمات");
  assert(servicesNavSrc.includes("/start-here") && servicesNavSrc.includes("/learning/paths"), "ابدأ/مسارات في مركز الخدمات");
  assert(servicesNavSrc.includes("/delete-account"), "حذف الحساب في مركز الخدمات");
  assert(navMapSrc.includes("BOTTOM_NAV_TABS") && navMapSrc.includes("SERVICES_CENTER_GROUPS"), "nav-map مصدر موحّد");
  assert(sidebarNavSrc.includes("getSidebarGroupsFromNavMap"), "الجانبية تشتق من nav-map");
  assert(sideSrc.includes("SIDEBAR_NAV_GROUPS") && sideSrc.includes("sidebar-panel"), "القائمة تستخدم التصميم الموحّد");
  assert(!sideSrc.includes("منصة علمية منظمة"), "لا وصف ترويجي في رأس القائمة");
  assert(!HIDDEN_FROM_NAV_PATHS.has("/about"), "about ظاهر للاكتشاف عبر عن المجلس");
}

console.log("\n=== الشريط السفلي والمزيد ===");
{
  const bottomSrc = readFileSync(resolve(appRoot, "src/components/BottomNavBar.tsx"), "utf-8");
  assert(bottomSrc.includes("BOTTOM_NAV_TABS"), "الشريط من nav-map");
  const navMapSrc = readFileSync(resolve(appRoot, "src/lib/nav-map.ts"), "utf-8");
  assert(navMapSrc.includes('label: "قرآن"') && navMapSrc.includes('label: "الدروس"'), "تسميات قرآن والدروس");
  assert(navMapSrc.includes('label: "الصلاة"') && navMapSrc.includes('label: "فقه"'), "تسميات الصلاة وفقه");
  assert(navMapSrc.includes('"/quran-knowledge"') && navMapSrc.includes('"/prayer-times"') && navMapSrc.includes('"/fiqh"') && navMapSrc.includes('"/lessons"'), "مسارات المساحات الأربع");
  assert(!bottomSrc.includes('label: "البحث"'), "البحث ليس تبويبًا سفليًا أساسيًا بعد التنظيف");
  const moreSrc = readFileSync(resolve(appRoot, "src/components/MoreBottomSheet.tsx"), "utf-8");
  assert(moreSrc.includes("filterServicesCenterGroups") || moreSrc.includes("services-center-nav"), "المزيد من كتالوج الخدمات");
  assert(moreSrc.includes("مركز الخدمات") || moreSrc.includes("حسابي"), "المزيد مركز خدمات");
  assert(moreSrc.includes("query") || moreSrc.includes("search"), "بحث داخل مركز الخدمات");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
