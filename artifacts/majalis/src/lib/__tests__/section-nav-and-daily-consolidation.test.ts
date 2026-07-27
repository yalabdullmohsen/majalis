/**
 * اختبار Regression لسلوكيات جديدة/مُصلَحة (2026-07-23):
 * - شريط الأقسام العلوي (TopSectionBar): تحديد القسم النشط الصحيح، بما
 *   فيه المسارات الفرعية، بلا التباس بين الأقسام.
 * - توحيد الأقسام اليومية: HOME_WIDGET_DEFS لم يعد يحوي الودجتين
 *   المُزالتين (hadith/daily-corner)، وsanitizePrefs يُصفّي بأمان أي
 *   تفضيل محلي قديم محفوظ يحوي معرّفيهما (توافق خلفي بلا كسر).
 * - تعطيل الباحث الشرعي: حالة سجل الميزات "disabled" بلا ظهور في القوائم.
 * - إعادة توجيه /scholarly-research وتسجيل /kids في مسارات SEO.
 *
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

console.log("\n=== TopSectionBar — محاور موسوعية بلا تكرار ===");
{
  assert(SECTION_TABS.length === 7, `7 أقسام في الشريط العلوي (الفعلي: ${SECTION_TABS.length})`);
  const hrefs = SECTION_TABS.map((t) => t.href);
  assert(new Set(hrefs).size === hrefs.length, "لا تكرار في مسارات الأقسام (كل href فريد)");
  assert(!hrefs.includes("/"), "«الرئيسية» غير ظاهرة داخل الشريط (تبقى ضمن التنقل الرئيسي فقط)");
  assert(!hrefs.includes("/features-in-progress"), "«مميزات قيد التطوير» غير ظاهرة داخل الشريط");
  assert(!hrefs.includes("/flashcards"), "بطاقات المراجعة أُخرجت من الشريط العلوي");
  assert(!hrefs.includes("/islam-stats"), "إحصائيات الإسلام أُخرجت من الشريط العلوي");
  assert(!hrefs.includes("/kids"), "الأطفال خارج الشريط العلوي (يبقى في المزيد بشارة قريبًا)");
  assert(!hrefs.includes("/mushaf"), "المصحف عبر مركز القرآن لا كتبويب موازٍ");
  assert(!hrefs.includes("/learn"), "بوابة /learn خارج الشريط (المسارات عبر المزيد)");
  const priorityFirst5 = ["/tawhid", "/seerah", "/fiqh", "/hadith", "/quran-hub"];
  assert(hrefs.slice(0, 5).join(",") === priorityFirst5.join(","),
    `أول 5 أقسام هي أولوية العقيدة/السيرة/الفقه/الحديث/القرآن بالترتيب (الفعلي: ${hrefs.slice(0, 5).join(",")})`);
  assert(hrefs.includes("/library") && hrefs.includes("/scholars"),
    "المكتبة والعلماء ضمن الشريط");
  for (const href of hrefs) {
    assert(href.startsWith("/") && href.length > 1, `مسار "${href}" يبدو مسارًا فعليًا (لا فارغ ولا وهمي)`);
  }
}

console.log("\n=== isTabActive — فتح القسم الصحيح من الشريط ===");
{
  assert(isTabActive("/quran-hub", "/quran-hub") === true, "تبويب القرآن نشط في مساره تمامًا");
  assert(isTabActive("/quran-hub/tajweed", "/quran-hub") === true, "تبويب القرآن يبقى نشطًا في مسار فرعي (لا يشترط تطابقًا حرفيًا)");
  assert(isTabActive("/quran-hubx", "/quran-hub") === false, "لا التباس مع مسار مشابه بالاسم لكن مختلف فعليًا (quran-hubx)");
  assert(isTabActive("/kids", "/quran-hub") === false, "تبويب القرآن غير نشط وأنت في قسم الأطفال");
  assert(isTabActive("/prophets", "/seerah") === true, "تبويب السيرة نشط في قصص الأنبياء");
  assert(isTabActive("/stories", "/seerah") === true, "تبويب السيرة نشط في القصص الإسلامية");
  assert(isTabActive("/library/book-1", "/library") === true, "تبويب المكتبة نشط في مسار كتاب");
  assert(isTabActive("/scholars/bukhari", "/scholars") === true, "تبويب العلماء نشط في ملف عالم");

  // لا قسمان نشطان معًا لنفس location — يمنع التباسًا بصريًا في الشريط.
  // (مسارا /mushaf و/mushaf/page مستثنيان هنا عمدًا: الشريط كلّه يختفي
  // فور دخول أي مسار يبدأ بـ/mushaf — قارئ المصحف الغامر له تنقّله
  // الخاص — فلا يُطرح سؤال "كم تبويبًا نشطًا" هناك أصلًا.)
  const sampleLocations = ["/quran-hub", "/kids", "/kids/x", "/other-page", "/", "/fiqh", "/scholars", "/prophets"];
  for (const loc of sampleLocations) {
    const activeCount = SECTION_TABS.filter((t) => isTabActive(loc, t.href)).length;
    assert(activeCount <= 1, `المسار "${loc}" يُفعِّل تبويبًا واحدًا كحد أقصى (الفعلي: ${activeCount})`);
  }
}

console.log("\n=== توحيد الأقسام اليومية — الودجتان المُزالتان اختفتا فعليًا ===");
{
  const ids = HOME_WIDGET_DEFS.map((w) => w.id);
  assert(!ids.includes("hadith" as HomeWidgetId), "الودجت \"hadith\" (حديث اليوم المنفصل) لم يعد في قائمة التخصيص");
  assert(!ids.includes("daily-corner" as HomeWidgetId), "الودجت \"daily-corner\" (الركن اليومي) لم يعد في قائمة التخصيص");
  assert(ids.includes("daily-benefits" as HomeWidgetId), "\"فوائد منتقاة\" بقيت (تغذية آلية حية، ليست تكرار محتوى نصي)");
  assert(new Set(ids).size === ids.length, "لا معرّفات ودجت مكرَّرة في HOME_WIDGET_DEFS");
}

console.log("\n=== sanitizePrefs — توافق خلفي مع تفضيلات محفوظة تحوي ودجتات محذوفة ===");
{
  const staleFromOldSession = {
    order: ["hadith", "daily-corner", "continue", "lessons"],
    hidden: ["hadith"],
  };
  const cleaned = sanitizePrefs(staleFromOldSession);
  assert(!cleaned.order.includes("hadith" as HomeWidgetId), "تفضيل قديم يحوي \"hadith\" يُصفَّى بلا خطأ عند التحميل");
  assert(!cleaned.order.includes("daily-corner" as HomeWidgetId), "تفضيل قديم يحوي \"daily-corner\" يُصفَّى بلا خطأ عند التحميل");
  assert(cleaned.order.includes("continue" as HomeWidgetId) && cleaned.order.includes("lessons" as HomeWidgetId),
    "الودجتات الصالحة الأخرى في نفس التفضيل القديم تبقى محفوظة");
  assert(cleaned.order.length === HOME_WIDGET_DEFS.length,
    `الترتيب المُصفَّى يحوي كل الودجتات الحالية بلا نقص أو زيادة (${cleaned.order.length}/${HOME_WIDGET_DEFS.length})`);
}

console.log("\n=== تعطيل الباحث الشرعي — سجل الميزات ===");
{
  const entry = FEATURE_REGISTRY.find((f) => f.id === "scholarly-research");
  assert(entry !== undefined, "المدخل ما زال موجودًا في السجل (لم يُحذف، عُطِّل فقط)");
  assert(entry?.status === "disabled", `الحالة "disabled" (الفعلية: ${entry?.status})`);
  assert(entry?.inSideNav === false, "لا يظهر في القائمة الجانبية");
  assert(entry?.inBottomNav === false, "لا يظهر في التنقل السفلي");

  const kidsEntry = FEATURE_REGISTRY.find((f) => f.id === "kids");
  assert(kidsEntry !== undefined && kidsEntry.status === "coming-soon" && kidsEntry.path === "/kids" && kidsEntry.inSideNav === false,
    "مدخل قسم الأطفال coming-soon وخارج القائمة الجانبية (يبقى في المزيد)");

  const circlesEntry = FEATURE_REGISTRY.find((f) => f.id === "quran-circles");
  assert(circlesEntry !== undefined && circlesEntry.status === "coming-soon" && circlesEntry.inSideNav === false,
    "حلقات التحفيظ بحالة coming-soon وخارج القائمة الجانبية");

  const uniEntry = FEATURE_REGISTRY.find((f) => f.id === "universities");
  assert(uniEntry !== undefined && uniEntry.inSideNav === false,
    "دليل الجامعات خارج القائمة الجانبية (مخفي من الاكتشاف)");
  assert(HIDDEN_FROM_NAV_PATHS.has("/universities"), "universities ضمن المسارات المخفية");

  const planEntry = FEATURE_REGISTRY.find((f) => f.id === "learning-plan");
  assert(planEntry !== undefined && planEntry.status === "disabled" && planEntry.inSideNav === false,
    "خطة التعلم مُعطّلة ومُزالة من القوائم (مدمجة في المسارات)");

  const annualEntry = FEATURE_REGISTRY.find((f) => f.id === "annual-courses");
  assert(annualEntry !== undefined && annualEntry.status === "disabled" && annualEntry.inSideNav === false,
    "قائمة الدورات السنوية مُعطّلة (مدمجة في /lessons?tab=courses)");
}

console.log("\n=== vercel.json — إعادة توجيه دائمة لمسار الباحث الشرعي ومسارات الدمج ===");
{
  const vercelConfig = JSON.parse(readFileSync(resolve(appRoot, "vercel.json"), "utf-8"));
  const redirects = vercelConfig.redirects as Array<{ source: string; destination: string; permanent: boolean }>;
  const redirect = redirects.find((r) => r.source === "/scholarly-research");
  assert(redirect !== undefined, "قاعدة توجيه على مستوى الخادم موجودة لـ /scholarly-research");
  assert(redirect?.destination === "/qa", `الوجهة /qa صحيحة (الفعلية: ${redirect?.destination})`);
  assert(redirect?.permanent === true, "التوجيه دائم (301) لا مؤقت — صحيح لمحركات البحث");

  const mergeRedirects: Array<[string, string]> = [
    ["/learning-plan", "/learning/paths"],
    ["/masarat", "/learning/paths"],
    ["/knowledge-map", "/knowledge-graph"],
    ["/learning/quiz", "/quiz"],
    ["/mushaf-v2-preview", "/mushaf"],
    ["/features-in-progress", "/updates"],
    ["/quran-studies", "/ulum-quran"],
    ["/anbiya", "/prophets"],
    ["/start-here", "/learning/paths"],
    ["/learning/calendar", "/calendar"],
    ["/prayer-countdown", "/prayer-times"],
    ["/annual-courses", "/lessons?tab=courses"],
  ];
  for (const [source, destination] of mergeRedirects) {
    const rule = redirects.find((r) => r.source === source);
    assert(rule !== undefined && rule.destination === destination && rule.permanent === true,
      `توجيه دائم ${source} → ${destination}`);
  }
}

console.log("\n=== seo-routes.json — /kids مسجَّل (noindex)، /scholarly-research أُزيل ===");
{
  const seoConfig = JSON.parse(readFileSync(resolve(appRoot, "src/lib/seo-routes.json"), "utf-8"));
  const routes = seoConfig.routes as Array<{ path: string; sitemap?: boolean; robots?: string }>;
  const kidsRoute = routes.find((r) => r.path === "/kids");
  assert(kidsRoute !== undefined, "/kids مسجَّل في seo-routes.json");
  assert(kidsRoute?.sitemap === false && kidsRoute?.robots === "noindex, follow",
    "/kids خارج sitemap وبـ noindex أثناء حالة قريبًا");
  const circlesRoute = routes.find((r) => r.path === "/quran-circles");
  assert(circlesRoute !== undefined && circlesRoute.sitemap === false && circlesRoute.robots === "noindex, follow",
    "/quran-circles خارج sitemap وبـ noindex أثناء حالة قريبًا");
  for (const p of ["/universities", "/universities/compare"]) {
    const route = routes.find((r) => r.path === p);
    assert(route !== undefined && route.sitemap === false, `${p} خارج sitemap بعد التنزيل`);
  }
  const mindMapRoute = routes.find((r) => r.path === "/mind-map");
  assert(mindMapRoute !== undefined && mindMapRoute.sitemap === true,
    "/mind-map في sitemap (محتوى حي تحت بوابة المعرفة)");
  assert(routes.find((r) => r.path === "/scholarly-research") === undefined,
    "/scholarly-research لم يعد في seo-routes.json (لن يظهر في sitemap.xml القادم)");
}

console.log("\n=== PRIMARY_NAV — أقسام رئيسية مختصرة ===");
{
  const hrefs = PRIMARY_NAV_ITEMS.map((i) => i.href);
  assert(hrefs.includes("/") && hrefs.includes("/quran-hub") && hrefs.includes("/fiqh"),
    "الهيدر يضم الرئيسية والقرآن والفقه");
  assert(!hrefs.includes("/annual-courses") && !hrefs.includes("/anbiya"),
    "الهيدر لا يعرض مسارات مدموجة");
  const learnReg = FEATURE_REGISTRY.find((f) => f.id === "learn");
  assert(learnReg?.status === "disabled" && learnReg.inBottomNav === false,
    "بوابة /learn معطّلة خارج التنقل السفلي");
  const lessonsReg = FEATURE_REGISTRY.find((f) => f.id === "lessons");
  assert(lessonsReg?.inBottomNav === false, "lessons خارج التنقل السفلي");
}

console.log("\n=== nav-visibility — إخفاء/دمج/قريبًا ===");
{
  for (const p of [
    "/islam-stats", "/study-room", "/vault", "/cards", "/car-mode", "/mosque-mode",
    "/family", "/universities", "/mind-map", "/mushaf/page", "/quran-circles",
    "/quran/recitation-test-ai",
    "/quran-studies", "/anbiya", "/start-here", "/learning/calendar",
    "/prayer-countdown", "/annual-courses", "/duas", "/prayer-ranks", "/sujood-sahw",
  ]) {
    assert(HIDDEN_FROM_NAV_PATHS.has(p), `${p} ضمن المسارات المخفية من الاكتشاف`);
  }
  assert(isComingSoonPath("/kids") && isComingSoonPath("/quran-circles"), "الأطفال وحلقات التحفيظ قريبًا");
  assert(resolveMergedPath("/knowledge-map") === "/knowledge-graph", "knowledge-map → knowledge-graph");
  assert(resolveMergedPath("/mind-map") === "/mind-map", "mind-map يبقى حيًا (لا توجيه)");
  assert(HIDDEN_FROM_NAV_PATHS.has("/mind-map"), "mind-map مخفي من القوائم الأولى ويُفتح من بوابة المعرفة");
  assert(resolveMergedPath("/learning-plan") === "/learning/paths", "learning-plan → learning/paths");
  assert(resolveMergedPath("/learning/quiz") === "/quiz", "learning/quiz → quiz");
  assert(resolveMergedPath("/features-in-progress") === "/updates", "features-in-progress → updates");
  assert(resolveMergedPath("/quran-studies") === "/ulum-quran", "quran-studies → ulum-quran");
  assert(resolveMergedPath("/anbiya") === "/prophets", "anbiya → prophets");
  assert(resolveMergedPath("/annual-courses") === "/lessons?tab=courses", "annual-courses → lessons?tab=courses");
  assert(Object.keys(MERGED_PATH_REDIRECTS).length >= 10, "جدول إعادة التوجيه غير فارغ");

  const filtered = filterNavItems([
    { href: "/learn" },
    { href: "/islam-stats" },
    { href: "/kids" },
    { href: "/vault" },
    { href: "/quran-circles" },
    { href: "/anbiya" },
  ]);
  assert(filtered.map((i) => i.href).join(",") === "/learn,/kids",
    `filterNavItems يُبقي الظاهر و«قريبًا» للأطفال ويُسقط المخفي (الفعلي: ${filtered.map((i) => i.href).join(",")})`);

  const homeHrefs = FEATURE_CATS.flatMap((c) => c.items.map((i) => i.href));
  assert(!homeHrefs.includes("/car-mode") && !homeHrefs.includes("/mosque-mode"),
    "كتالوج الرئيسية لا يعرض أوضاع السيارة/المسجد");
  assert(!homeHrefs.includes("/islam-stats"), "كتالوج الرئيسية لا يعرض الإحصاءات");
  assert(!homeHrefs.includes("/mind-map"), "كتالوج الأقسام لا يعرض mind-map كمدخل أول (يُفتح من بوابة المعرفة)");
  assert(!homeHrefs.includes("/anbiya") && homeHrefs.includes("/prophets"),
    "كتالوج الرئيسية يشير إلى /prophets لا /anbiya");
  assert(!homeHrefs.includes("/duas") && homeHrefs.includes("/adhkar"),
    "اكتشاف الأدعية عبر الأذكار لا صفحة /duas منفصلة");
  assert(homeHrefs.includes("/fiqh") && !homeHrefs.includes("/qa") && !homeHrefs.includes("/rulings"),
    "مدخل الفقه موحّد عبر /fiqh في الكتالوج");
}

console.log("\n=== sitemap + SEO لمسارات مدمجة/مخفية ===");
{
  const sitemap = readFileSync(resolve(appRoot, "public/sitemap.xml"), "utf-8");
  for (const p of [
    "/kids", "/quran-circles", "/cards", "/learning-plan", "/study-room",
    "/universities", "/universities/compare", "/knowledge-map", "/islam-stats",
    "/quran-studies", "/anbiya", "/start-here", "/prayer-countdown", "/annual-courses",
  ]) {
    assert(!sitemap.includes(`majlisilm.com${p}<`), `${p} خارج sitemap.xml`);
  }
  const seoConfig = JSON.parse(readFileSync(resolve(appRoot, "src/lib/seo-routes.json"), "utf-8"));
  const routes = seoConfig.routes as Array<{ path: string; sitemap?: boolean; robots?: string }>;
  for (const p of ["/learning-plan", "/knowledge-map", "/quran-studies", "/anbiya", "/start-here", "/annual-courses"]) {
    const route = routes.find((r) => r.path === p);
    assert(route?.sitemap === false && route?.robots === "noindex, follow",
      `${p} خارج sitemap وبـ noindex (مسار تحويل)`);
  }
}

console.log("\n=== بلا تكرار /ulum-quran في المزيد والجانبية ===");
{
  const moreSrc = readFileSync(resolve(appRoot, "src/components/MoreBottomSheet.tsx"), "utf-8");
  const sideSrc = readFileSync(resolve(appRoot, "src/components/SideNavDrawer.tsx"), "utf-8");
  const moreHits = moreSrc.match(/href:\s*"\/ulum-quran"/g) ?? [];
  const sideHits = sideSrc.match(/href:\s*"\/ulum-quran"/g) ?? [];
  assert(moreHits.length === 1, `علوم القرآن مرة واحدة في المزيد (الفعلي: ${moreHits.length})`);
  assert(sideHits.length === 1, `علوم القرآن مرة واحدة في الجانبية (الفعلي: ${sideHits.length})`);
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
