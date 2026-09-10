/**
 * بوابة أساس الاستقرار — تمنع رجوع أعطال P0 المعروفة.
 * تشغيل: node --import tsx src/lib/__tests__/ssunnah-stability-foundation-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

/* تنقّل: حارس نقر مزدوج + زر رجوع بلا setTimeout */
const navGuard = read("src/lib/nav-click-guard.ts");
assert.match(navGuard, /shouldAllowNavigation/, "حارس تنقّل موجود");
assert.match(navGuard, /DEFAULT_GAP_MS\s*=\s*380/, "فجوة منع مزدوج 380ms");

const bottom = read("src/components/BottomNavBar.tsx");
assert.match(bottom, /shouldAllowNavigation/, "الشريط السفلي يستخدم الحارس");

const back = read("src/components/common/AppBackButton.tsx");
assert.doesNotMatch(back, /window\.setTimeout|setTimeout\s*\(/, "رجوع بلا setTimeout");
assert.match(back, /BACK_LOCK_MS\s*=\s*420/, "قفل رجوع 420ms");
assert.match(back, /lastBackAtRef|Date\.now/, "قفل زمني فوري");

/* هيكل مسار: بلا نص تحميل ظاهر */
const fallback = read("src/components/LazyRouteFallback.tsx");
assert.doesNotMatch(fallback, /جارٍ التحميل|جاري التحميل|تجهيز الصفحة/, "هيكل صامت");
assert.match(fallback, /aria-busy/, "aria-busy فقط");
assert.match(fallback, /STATUS\.updating|aria-label/, "تسمية قارئة شاشة");

/* دخولية: استقرار الهيكل + تقليل الحركة */
const splash = read("src/lib/splash-screen.ts");
assert.match(splash, /mj:shell-stable/, "إخفاء بعد استقرار الهيكل");
assert.match(splash, /prefers-reduced-motion/, "احترام تقليل الحركة");
assert.doesNotMatch(splash, /جارٍ التحميل|تجهيز الصفحة/, "بلا نص تحميل في الدخولية");

/* مصادقة: لا وميض ضيف قبل اكتمال التهيئة */
const auth = read("src/components/AuthProvider.tsx");
assert.match(auth, /"initializing"/, "حالة initializing");
assert.match(auth, /loading:\s*status\s*===\s*"initializing"/, "loading = initializing");

const admin = read("src/components/AdminRouteGuard.tsx");
assert.match(admin, /loading/, "حارس الإدارة ينتظر التهيئة");
assert.match(admin, /if \(loading\) return/, "لا توجيه أثناء loading");

/* مصحف: تقليب translate بلا setTimeout لإكمال الحركة */
const pager = read("src/features/mushaf-reader/useMushafPager.ts");
assert.match(pager, /translate3d/, "تقليب translate3d");
assert.doesNotMatch(
  pager,
  /setTimeout\(\s*\(\)\s*=>\s*\{\s*finishPageTurn/,
  "بلا setTimeout لإكمال التقليب",
);

/* تثبيت اللقطات البصرية */
const stabilizeRel = "scripts/lib/visual-test-stabilize.mjs";
assert.ok(existsSync(resolve(root, stabilizeRel)), "مساعد تثبيت اللقطات موجود");
const stab = read(stabilizeRel);
assert.match(stab, /stabilizeVisualContext/, "stabilizeVisualContext");
assert.match(stab, /waitForVisualReady/, "waitForVisualReady");
assert.match(stab, /document\.fonts/, "انتظار الخطوط");
assert.match(stab, /animation:\s*none|animation-duration:\s*0/, "تعطيل الحركة");

const uiVis = read("scripts/ui-regression-visual.mjs");
assert.match(uiVis, /stabilizeVisualContext/, "ui-regression يستخدم التثبيت");
assert.match(uiVis, /VISUAL_CONTEXT_OPTIONS/, "locale/RTL مشتركة");

const mushafVis = read("scripts/mushaf-madinah/visual-snapshot.mjs");
assert.match(mushafVis, /stabilizeVisualContext/, "لقطات المصحف تستخدم التثبيت");

/* شريط دون اتصال — نص بوابة الجودة */
const offline = read("src/components/OfflineBanner.tsx");
assert.match(
  offline,
  /أنت غير متصل، سيتم عرض المحتوى المحفوظ/,
  "نص الأوفلاين مطابق للجودة",
);

console.log("ssunnah-stability-foundation-gate.test.ts: ok");
