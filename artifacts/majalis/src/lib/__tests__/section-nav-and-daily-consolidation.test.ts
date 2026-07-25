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

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ FAIL: ${label}`); failed++; }
}

console.log("\n=== TopSectionBar — 22 قسمًا فعليًا بلا تكرار وبلا الرئيسية ===");
{
  assert(SECTION_TABS.length === 22, `22 قسمًا بالضبط (الفعلي: ${SECTION_TABS.length})`);
  const hrefs = SECTION_TABS.map((t) => t.href);
  assert(new Set(hrefs).size === hrefs.length, "لا تكرار في مسارات الأقسام (كل href فريد)");
  assert(!hrefs.includes("/"), "«الرئيسية» غير ظاهرة داخل الشريط (تبقى ضمن التنقل الرئيسي فقط)");
  assert(!hrefs.includes("/features-in-progress"), "«مميزات قيد التطوير» غير ظاهرة داخل الشريط");
  const priorityFirst5 = ["/tawhid", "/seerah", "/fiqh", "/hadith", "/quran-hub"];
  assert(hrefs.slice(0, 5).join(",") === priorityFirst5.join(","),
    `أول 5 أقسام هي أولوية العقيدة/السيرة/الفقه/الحديث/القرآن بالترتيب (الفعلي: ${hrefs.slice(0, 5).join(",")})`);
  assert(hrefs.includes("/kids"), "قسم الأطفال ضمن الشريط");
  for (const href of hrefs) {
    assert(href.startsWith("/") && href.length > 1, `مسار "${href}" يبدو مسارًا فعليًا (لا فارغ ولا وهمي)`);
  }
}

console.log("\n=== isTabActive — فتح القسم الصحيح من الشريط ===");
{
  assert(isTabActive("/quran-hub", "/quran-hub") === true, "تبويب القرآن نشط في مساره تمامًا");
  assert(isTabActive("/quran-hub/tajweed", "/quran-hub") === true, "تبويب القرآن يبقى نشطًا في مسار فرعي (لا يشترط تطابقًا حرفيًا)");
  assert(isTabActive("/quran-hubx", "/quran-hub") === false, "لا التباس مع مسار مشابه بالاسم لكن مختلف فعليًا (quran-hubx)");
  assert(isTabActive("/kids", "/kids") === true, "تبويب الأطفال نشط في مساره");
  assert(isTabActive("/kids", "/quran-hub") === false, "تبويب القرآن غير نشط وأنت في قسم الأطفال");
  assert(isTabActive("/learn/lesson-1", "/learn") === true, "تبويب تعلّم نشط في مسار درس فرعي");
  assert(isTabActive("/mushaf/page/12", "/mushaf/page") === true, "تبويب المصحف بنظام الصفحات نشط في مسار فرعي مرقّم");
  assert(isTabActive("/mushaf", "/mushaf/page") === false, "لا التباس بين /mushaf و/mushaf/page رغم اشتراك البادئة");

  // لا قسمان نشطان معًا لنفس location — يمنع التباسًا بصريًا في الشريط.
  // (مسارا /mushaf و/mushaf/page مستثنيان هنا عمدًا: الشريط كلّه يختفي
  // فور دخول أي مسار يبدأ بـ/mushaf — قارئ المصحف الغامر له تنقّله
  // الخاص — فلا يُطرح سؤال "كم تبويبًا نشطًا" هناك أصلًا.)
  const sampleLocations = ["/quran-hub", "/kids", "/kids/x", "/other-page", "/", "/quran/tajweed", "/updates"];
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
  assert(kidsEntry !== undefined && kidsEntry.status === "active" && kidsEntry.path === "/kids",
    "مدخل قسم الأطفال الجديد مسجَّل بحالة active ومسار /kids صحيح");
}

console.log("\n=== vercel.json — إعادة توجيه دائمة لمسار الباحث الشرعي ===");
{
  const vercelConfig = JSON.parse(readFileSync(resolve(appRoot, "vercel.json"), "utf-8"));
  const redirect = (vercelConfig.redirects as Array<{ source: string; destination: string; permanent: boolean }>)
    .find((r) => r.source === "/scholarly-research");
  assert(redirect !== undefined, "قاعدة توجيه على مستوى الخادم موجودة لـ /scholarly-research");
  assert(redirect?.destination === "/qa", `الوجهة /qa صحيحة (الفعلية: ${redirect?.destination})`);
  assert(redirect?.permanent === true, "التوجيه دائم (301) لا مؤقت — صحيح لمحركات البحث");
}

console.log("\n=== seo-routes.json — /kids مسجَّل، /scholarly-research أُزيل ===");
{
  const seoConfig = JSON.parse(readFileSync(resolve(appRoot, "src/lib/seo-routes.json"), "utf-8"));
  const routes = seoConfig.routes as Array<{ path: string; sitemap?: boolean }>;
  const kidsRoute = routes.find((r) => r.path === "/kids");
  assert(kidsRoute !== undefined, "/kids مسجَّل في seo-routes.json");
  assert(kidsRoute?.sitemap === true, "/kids يظهر في sitemap.xml");
  assert(routes.find((r) => r.path === "/scholarly-research") === undefined,
    "/scholarly-research لم يعد في seo-routes.json (لن يظهر في sitemap.xml القادم)");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
