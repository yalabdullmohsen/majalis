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
import { SERVICES_CENTER_GROUPS } from "../services-center-nav";

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
  assert(SECTION_TABS.length === 5, `5 مساحات في الشريط العلوي (الفعلي: ${SECTION_TABS.length})`);
  const hrefs = SECTION_TABS.map((t) => t.href);
  const labels = SECTION_TABS.map((t) => t.label);
  assert(new Set(hrefs).size === hrefs.length, "لا تكرار في مسارات الأقسام");
  assert(hrefs.includes("/quran-hub") && labels.includes("مركز القرآن الكريم"), "مساحة مركز القرآن الكريم");
  assert(hrefs.includes("/lessons") && labels.includes("الدروس"), "مساحة الدروس");
  assert(hrefs.includes("/prayer-times") && labels.includes("الصلاة"), "مساحة الصلاة");
  assert(hrefs.includes("/fiqh") && (labels.includes("فقه") || labels.includes("الفقه والأحكام")), "مساحة فقه");
  assert(hrefs.includes("/sections") && labels.includes("الأقسام"), "مساحة الأقسام");
  assert(!hrefs.includes("/library"), "المكتبة خارج الشريط");
  assert(!labels.includes("المزيد") && !labels.includes("قرآن"), "لا تسميات قديمة في الشريط");
}

console.log("\n=== isTabActive ===");
{
  assert(isTabActive("/mushaf", "/quran-hub") === true, "المصحف تحت قرآن");
  assert(isTabActive("/quran-hub", "/quran-hub") === true, "مركز القرآن الكريم تحت قرآن");
  assert(isTabActive("/ulum-quran", "/quran-hub") === true, "علوم القرآن تحت قرآن");
  assert(isTabActive("/quran/surah-stories", "/quran-hub") === true, "قصص السور تحت قرآن");
  assert(isTabActive("/mushaf", "/quran-knowledge") === true, "توافق مسارات المعرفة");
  assert(isTabActive("/hadith", "/lessons") === false, "الحديث تحت المزيد لا الدروس");
  assert(isTabActive("/adhkar", "/prayer-times") === true, "الأذكار تحت الصلاة");
  assert(isTabActive("/quiz", "/fiqh") === false, "سين جيم تحت المزيد لا فقه");
  assert(isTabActive("/qa", "/fiqh") === false, "مسار /qa لا يُحسب تحت فقه");
  assert(isTabActive("/quiz", "/quran-hub") === false, "سين جيم ليس تحت قرآن");
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
  const uni = FEATURE_REGISTRY.find((f) => f.id === "universities");
  assert(uni?.status === "active", "دليل الجامعات فعّال");
  assert(!HIDDEN_FROM_NAV_PATHS.has("/universities"), "universities ظاهر في الاكتشاف");
  const researches = FEATURE_REGISTRY.find((f) => f.id === "researches");
  assert(researches?.status === "active", "الأبحاث والرسائل فعّالة");
  assert(!HIDDEN_FROM_NAV_PATHS.has("/academic-research"), "academic-research ظاهر في الاكتشاف");
}

console.log("\n=== vercel redirects للتنظيف ===");
{
  const vercelConfig = JSON.parse(readFileSync(resolve(appRoot, "vercel.json"), "utf-8"));
  const redirects = vercelConfig.redirects as Array<{ source: string; destination: string; permanent: boolean }>;
  const expect: Array<[string, string]> = [
    ["/researches", "/academic-research"],
    ["/quran-index", "/quran-knowledge"],
    ["/memorization-tests", "/memorization"],
    ["/islamic-institutions", "/islamic-directory"],
    ["/reviewed-cards", "/my-learning"],
    ["/learning-plan", "/lessons"],
    ["/quran-studies", "/quran-knowledge"],
  ];
  for (const [source, destination] of expect) {
    const rule = redirects.find((r) => r.source === source);
    assert(!!rule && rule.destination === destination && rule.permanent === true,
      `توجيه ${source} → ${destination}`);
  }
  assert(!redirects.some((r) => r.source === "/academic-research" && r.destination === "/"),
    "لا توجيه academic-research إلى الرئيسية");
}

console.log("\n=== PRIMARY_NAV ===");
{
  const hrefs = PRIMARY_NAV_ITEMS.map((i) => i.href);
  assert(hrefs.includes("/") && hrefs.includes("/quran-hub") && hrefs.includes("/fiqh"), "هيدر أساسي");
  assert(hrefs.includes("/lessons") && hrefs.includes("/prayer-times"), "الدروس والصلاة في PRIMARY_NAV");
  assert(!hrefs.includes("/library"), "لا مكتبة في PRIMARY_NAV");
}

console.log("\n=== nav-visibility تنظيف ===");
{
  for (const p of ["/flashcards", "/ulum-quran", "/occasions", "/institutions", "/rulings", "/fiqh-council"]) {
    assert(HIDDEN_FROM_NAV_PATHS.has(p), `${p} مخفي من الاكتشاف العام`);
  }
  assert(!HIDDEN_FROM_NAV_PATHS.has("/library"), "المكتبة ظاهرة في المزيد");
  assert(resolveMergedPath("/library") === "/library", "library لا تُحوَّل للرئيسية");
  assert(resolveMergedPath("/quran-index") === "/quran-knowledge", "quran-index → hub");
  assert(resolveMergedPath("/reviewed-cards") === "/my-learning", "reviewed-cards → حسابي");
  assert(resolveMergedPath("/researches") === "/academic-research", "researches → academic-research");
  assert(resolveMergedPath("/start-here") === "/lessons", "start-here → lessons");
  assert(Object.keys(MERGED_PATH_REDIRECTS).length >= 10, "جدول التوجيه غير فارغ");
  assert(isComingSoonPath("/kids"), "الأطفال قريبًا");
  assert(!isComingSoonPath("/mushaf"), "المصحف لم يعد قريبًا");
  assert(!isComingSoonPath("/mushaf/1"), "مسارات المصحف الفرعية مفتوحة");

  const homeHrefs = FEATURE_CATS.flatMap((c) => c.items.map((i) => i.href));
  assert(!homeHrefs.includes("/flashcards"), "الكتالوج بلا بطاقات منفصلة");
  assert(homeHrefs.includes("/quran-hub"), "بوابة القرآن في الكتالوج");
  assert(!homeHrefs.includes("/memorization"), "الحفظ تحت مركز القرآن الكريم لا كقسم عام");
  assert(homeHrefs.includes("/universities") && homeHrefs.includes("/academic-research"), "الجامعات والرسائل في الكتالوج");
  assert(filterNavItems([{ href: "/rulings" }, { href: "/mushaf" }]).map((i) => i.href).join(",") === "/mushaf",
    "filterNavItems يسقط الأحكام كقسم عام");
}

console.log("\n=== القوائم بلا أقسام محذوفة — عن المجلس في المصدر الموحّد ===");
{
  const sectionsSrc = readFileSync(resolve(appRoot, "src/pages/account/SectionsPage.tsx"), "utf-8");
  const moreHubSrc = readFileSync(resolve(appRoot, "src/features/more/MoreHubFromRegistry.tsx"), "utf-8");
  const sideSrc = readFileSync(resolve(appRoot, "src/components/SideNavDrawer.tsx"), "utf-8");
  const sidebarNavSrc = readFileSync(resolve(appRoot, "src/lib/sidebar-nav.ts"), "utf-8");
  const servicesNavSrc = readFileSync(resolve(appRoot, "src/lib/services-center-nav.ts"), "utf-8");
  const navMapSrc = readFileSync(resolve(appRoot, "src/lib/nav-map.ts"), "utf-8");
  const homeSrc = readFileSync(resolve(appRoot, "src/pages/account/ui/HomeView.tsx"), "utf-8")
    + readFileSync(resolve(appRoot, "src/pages/account/ui/HomeBelowFold.tsx"), "utf-8");
  const footerSrc = readFileSync(resolve(appRoot, "src/components/SiteFooter.tsx"), "utf-8");
  const appSrc = readFileSync(resolve(appRoot, "src/App.tsx"), "utf-8") + "\n" + readFileSync(resolve(appRoot, "src/AppRoutes.tsx"), "utf-8");
  for (const src of [moreHubSrc, sideSrc, sidebarNavSrc]) {
    assert(!src.includes('href: "/rulings"'), "لا أحكام كقسم رئيسي في القوائم الجامدة");
    assert(!src.includes('"/knowledge-graph"'), "لا استكشف المعرفة");
  }
  const moreSecSrc = readFileSync(resolve(appRoot, "src/features/more/moreSections.ts"), "utf-8");
  assert(moreSecSrc.includes("sections.registry"), "المكتبة والحديث في الأقسام");
  assert(sectionsSrc.includes("MoreHubFromRegistry") || sectionsSrc.includes("SectionsHubFromRegistry"), "صفحة الأقسام من السجل");
  assert(!sectionsSrc.includes("إغلاق") && !sectionsSrc.includes("MoreBottomSheet"), "صفحة الأقسام بلا إغلاق/شيت");
  assert(
    SERVICES_CENTER_GROUPS.some((g) =>
      g.items.some(
        (i) =>
          i.action.kind === "link" &&
          (i.action.href === "/universities" || i.action.href === "/academic-research"),
      ),
    ),
    "الجامعات والرسائل في مركز الخدمات",
  );
  assert(appSrc.includes("AcademicResearchPage") && !appSrc.includes('<Route path="/academic-research"><Redirect to="/"'),
    "صفحة الأبحاث مفعّلة بلا تحويل للرئيسية");
  assert(!homeSrc.includes("HomeAboutSection"), "من نحن خارج الرئيسية");
  const footerNavSrc = readFileSync(resolve(appRoot, "src/lib/site-footer-nav.ts"), "utf-8");
  assert(footerSrc.includes("SITE_FOOTER_GROUPS") || footerSrc.includes("site-footer-nav"), "التذييل من مصدر المجموعات");
  assert(footerNavSrc.includes("/about") && footerNavSrc.includes("/privacy"), "تذييل عن المجلس");
  assert(footerNavSrc.includes("/lessons") && footerNavSrc.includes("/quiz"), "تذييل دروس/سين جيم");
  assert(footerNavSrc.includes("SITE_FOOTER_GROUPS") && footerNavSrc.includes("الأقسام"), "تذييل رباعي المجموعات");
  for (const title of ["الأقسام", "ابدأ", "الثقة", "قانوني"]) {
    assert(footerNavSrc.includes(`title: "${title}"`), `مجموعة التذييل: ${title}`);
  }
  assert(!footerNavSrc.includes('title: "استكشف"'), "لا مجموعة خامسة في التذييل");
  for (const href of ["/methodology", "/fatwa-policy", "/about", "/privacy", "/contact"]) {
    assert(footerNavSrc.includes(href), `رابط التذييل: ${href}`);
  }
  assert(
    appSrc.includes("SiteFooter") &&
      appSrc.includes("{!hideSiteChrome && !isNative && <SiteFooter />}"),
    "التذييل في غلاف التطبيق (ويب فقط — مخفي على Capacitor)",
  );
  assert(footerNavSrc.includes("الريادة الإسلامية الرقمية"), "سطر الريادة في التذييل");
  assert(
    moreSecSrc.includes("sections.registry") && servicesNavSrc.includes("sections.registry"),
    "مركز الخدمات/الأقسام من السجل",
  );
  const aboutOk =
    SERVICES_CENTER_GROUPS.some((g) => g.items.some((i) => i.label.includes("عن المجلس") || (i.action.kind === "link" && i.action.href === "/about")));
  assert(aboutOk, "عن المجلس في مركز الخدمات");
  const deleteOk = SERVICES_CENTER_GROUPS.some((g) =>
    g.items.some((i) => i.id === "delete-account" || i.label.includes("حذف الحساب")),
  );
  assert(deleteOk, "حذف الحساب في مركز الخدمات");
  assert(!servicesNavSrc.includes("/start-here"), "لا ابدأ من هنا في مركز الخدمات");
  assert(!servicesNavSrc.includes('label: "موسوعة الأحكام"'), "لا موسوعة أحكام في القائمة العامة");
  assert(!servicesNavSrc.includes('label: "المجامع الفقهية"'), "لا مجامع كقسم رئيسي");
  assert(navMapSrc.includes("BOTTOM_NAV_TABS") && navMapSrc.includes("SERVICES_CENTER_GROUPS"), "nav-map مصدر موحّد");
  assert(
    sidebarNavSrc.includes("sections.registry") || sidebarNavSrc.includes("config/navigation"),
    "الجانبية تشتق من السجل أو nav-map",
  );
  assert(sideSrc.includes("SIDEBAR_NAV_GROUPS") && sideSrc.includes("sidebar-panel"), "القائمة تستخدم التصميم الموحّد");
  assert(!sideSrc.includes("منصة علمية منظمة"), "لا وصف ترويجي في رأس القائمة");
  assert(!HIDDEN_FROM_NAV_PATHS.has("/about"), "about ظاهر للاكتشاف عبر عن المجلس");
}

console.log("\n=== الشريط السفلي والأقسام ===");
{
  const bottomSrc = readFileSync(resolve(appRoot, "src/components/BottomNavBar.tsx"), "utf-8");
  assert(bottomSrc.includes("BOTTOM_NAV_TABS"), "الشريط من nav-map");
  assert(!bottomSrc.includes("MoreBottomSheet"), "لا شيت المزيد في الشريط");
  assert(!bottomSrc.includes("المزيد"), "لا تسمية المزيد في الشريط");
  const navMapSrc = readFileSync(resolve(appRoot, "src/lib/nav-map.ts"), "utf-8");
  assert(navMapSrc.includes("navFor") || navMapSrc.includes("config/navigation"), "الشريط من سجل الأقسام");
  const registrySrc = readFileSync(resolve(appRoot, "src/config/sections.registry.ts"), "utf-8");
  assert(registrySrc.includes('route: "/quran-hub"') && registrySrc.includes("مركز القرآن الكريم"), "مسار مركز القرآن الكريم");
  assert(registrySrc.includes('route: "/prayer-times"') && registrySrc.includes('route: "/fiqh"') && registrySrc.includes('route: "/lessons"') && registrySrc.includes('route: "/sections"'), "مسارات المساحات");
  assert(!bottomSrc.includes('label: "البحث"'), "البحث ليس تبويبًا سفليًا أساسيًا بعد التنظيف");
  const sectionsSrc = readFileSync(resolve(appRoot, "src/pages/account/SectionsPage.tsx"), "utf-8");
  assert(sectionsSrc.includes("MoreHubFromRegistry") || sectionsSrc.includes("SectionsHubFromRegistry"), "الأقسام من سجل الأقسام");
  assert(sectionsSrc.includes("الأقسام"), "عنوان الأقسام");
  const hubSrc = readFileSync(resolve(appRoot, "src/features/more/MoreHubFromRegistry.tsx"), "utf-8");
  assert(!hubSrc.includes("sections-hub__search"), "بلا بحث محلي مكرر مع الشريط العام");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
