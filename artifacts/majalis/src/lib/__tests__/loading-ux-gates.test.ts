/**
 * بوابات قبول: بلا نص «جارٍ التحميل»، بلا BrandReveal، شريط واحد لكل موضع.
 * تشغيل: node --import tsx src/lib/__tests__/loading-ux-gates.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const srcRoot = resolve(root, "src");

function walkTs(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === "__tests__") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkTs(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

const files = walkTs(srcRoot);
const loadHits: string[] = [];
const busyHits: string[] = [];
const busyRoots = [
  "pages/",
  "components/NavBar.tsx",
  "components/SideNavDrawer.tsx",
  "components/UpdateAvailableBanner.tsx",
  "components/prayer/PrayerLocationPicker.tsx",
  "components/fiqh-council/FiqhCouncilSearchBox.tsx",
  "components/QuranViewer.tsx",
  "components/quran/QuranPlayerView.tsx",
  "features/mushaf-madinah/MushafSearchSheet.tsx",
  "views/PrivacyCenterPage.tsx",
  "views/TranscribePage.tsx",
  "views/CardsPage.tsx",
  "views/MyCitationsPage.tsx",
  "views/UpdatePasswordPage.tsx",
  "views/DiscoverIslamContactPage.tsx",
  "views/SubmitContentPage.tsx",
  "views/UploadPage.tsx",
  "views/ResearcherProfilePage.tsx",
  "components/AdminRouteGuard.tsx",
  "components/ErrorBoundary.tsx",
  "components/ContentActions.tsx",
  "components/HomeDashboard.tsx",
  "components/ChunkRecoveryToast.tsx",
  "components/fawaid/FaidaImageCardModal.tsx",
  "components/quiz-game/DirectQaCard.tsx",
  "components/quran/BulkDownloadCard.tsx",
  "views/AcademicResearchPage.tsx",
  "views/AuthCallbackPage.tsx",
  "views/learning/CertificateVerifyPage.tsx",
  "views/learning/LearningPathDetailPage.tsx",
  "components/learning/AssessmentModal.tsx",
  "components/citation/CitationModal.tsx",
  "components/assistant/AssistantChatView.tsx",
];
for (const f of files) {
  const rel = f.replace(srcRoot + "/", "");
  const text = readFileSync(f, "utf8");
  if (/جارٍ\s*التحميل|جاري\s*التحميل|جارٍ\s*تحميل|جاري\s*تحميل/.test(text)) {
    loadHits.push(rel);
  }
  if (busyRoots.some((root) => rel === root || rel.startsWith(root))) {
    if (/جاري\s*تجهيز|جارٍ\s*تجهيز|جاري\s*البحث|جارٍ\s*البحث|جاري\s*التحديث|جاري\s*الرفع|جاري\s*التحليل|جاري\s*المعالجة|جاري\s*التصدير|جاري\s*التحديد|جاري\s*المزامنة|جاري\s*الإنشاء|جاري\s*التلاوة|جارٍ\s*الإرسال|جارٍ\s*الحفظ|جارٍ\s*التحويل/.test(text)) {
      busyHits.push(rel);
    }
  }
}
assert.equal(loadHits.length, 0, `صفر ظهور لسلسلة التحميل. بقي: ${loadHits.join(", ")}`);
assert.equal(busyHits.length, 0, `صفر ظهور لنصوص الانشغال الظاهرة. بقي: ${busyHits.join(", ")}`);

assert.ok(!existsSync(resolve(srcRoot, "components/BrandReveal.tsx")), "BrandReveal محذوف");

const app = readFileSync(resolve(srcRoot, "App.tsx"), "utf8") + "\n" + readFileSync(resolve(srcRoot, "AppRoutes.tsx"), "utf8");
assert.match(app, /<NavBar\s*\/>/);
assert.match(app, /<TopSectionBar\s*\/>/);
assert.match(app, /<BottomNavBar\b/);
const topCount = (app.match(/<TopSectionBar\b/g) || []).length;
const bottomCount = (app.match(/<BottomNavBar\b/g) || []).length;
assert.equal(topCount, 1, "شريط أقسام علوي واحد");
assert.equal(bottomCount, 1, "شريط سفلي واحد");

const navCss = readFileSync(resolve(srcRoot, "styles/m2030/navigation.css"), "utf8");
assert.match(navCss, /max-width:\s*767\.98px/, "إخفاء الشريط العلوي على الجوال");
assert.match(navCss, /min-width:\s*768px/, "إخفاء الشريط السفلي على سطح المكتب");

const guard = readFileSync(resolve(srcRoot, "components/PageLoadingGuard.tsx"), "utf8");
assert.match(guard, /useDeferredLoading/);
assert.match(guard, /SkeletonCardGrid|skeleton/);
assert.match(guard, /keepPrevious/);
assert.doesNotMatch(guard, /جارٍ التحميل/);

const loading = readFileSync(resolve(srcRoot, "components/ui-common.tsx"), "utf8");
assert.match(loading, /export function Loading/);
assert.match(loading, /SkeletonPage/);
assert.doesNotMatch(loading, /جارٍ التحميل/);

const lessons = readFileSync(resolve(srcRoot, "lib/lessons-service.ts"), "utf8");
assert.match(lessons, /majalis-lessons-unified-v1/, "كاش دروس للزيارة الثانية");
assert.match(lessons, /readPersistedLessons|PERSIST_KEY/);

console.log("loading-ux-gates.test.ts: ok");
