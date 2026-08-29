/**
 * مسارات الواجهة الغامرة — المصحف واختبار التسميع بلا شريط مشترك.
 * مركز القرآن الكريم بوابة عادية (ليست غمرية).
 * صفحة الصلاة تُبقي الشريط السفلي ظاهرًا (2026-08).
 * تشغيل: npx tsx src/lib/__tests__/immersive-chrome.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isAuthStandalonePath,
  isImmersiveChromePath,
  isPrayerTimesPath,
  isQuranImmersivePath,
} from "../immersive-chrome";
import "./get-active-tab.test.ts";
import "./featured-home-status.test.ts";
import "./phase3-batch1-gate.test.ts";
import "./instant-back-auth-gate.test.ts";
import "./hifz-audio-loop-gate.test.ts";
import "./quran-worship-hub-gate.test.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

assert.equal(isPrayerTimesPath("/prayer-times"), true);
assert.equal(isPrayerTimesPath("/prayer-times/"), true);
assert.equal(isPrayerTimesPath("/fiqh"), false);

assert.equal(isQuranImmersivePath("/mushaf"), true, "المصحف غمري أثناء القراءة");
assert.equal(isQuranImmersivePath("/mushaf/page/1"), true);
assert.equal(isQuranImmersivePath("/quran-hub"), false, "مركز القرآن الكريم ليس غمريًا");
assert.equal(isQuranImmersivePath("/fiqh"), false);

assert.equal(isImmersiveChromePath("/prayer-times"), false, "الصلاة ليست غمرية كاملة — الشريط السفلي وشريط الأقسام ظاهران");
assert.equal(isImmersiveChromePath("/mushaf"), true, "قارئ المصحف غمري");
assert.equal(isImmersiveChromePath("/mushaf/2"), true);
assert.equal(isImmersiveChromePath("/quran-hub"), false, "مركز القرآن الكريم يظهر الشريط السفلي");
assert.equal(isImmersiveChromePath("/quran/recitation-test-ai"), true);
assert.equal(isImmersiveChromePath("/"), false);
assert.equal(isImmersiveChromePath("/hadith"), false);

assert.equal(isAuthStandalonePath("/login"), true);
assert.equal(isAuthStandalonePath("/register"), true);
assert.equal(isAuthStandalonePath("/auth/callback"), true);
assert.equal(isAuthStandalonePath("/"), false);

const prayerSrc = readFileSync(resolve(appRoot, "src/pages/worship/ui/PrayerTimesView.tsx"), "utf8");
assert.equal(prayerSrc.includes("SectionQuiz"), false, "صفحة الصلاة بلا SectionQuiz");
assert.equal(prayerSrc.includes("categoryId"), false, "صفحة الصلاة لا تحمّل تصنيفات اختبار");
assert.match(prayerSrc, /مضى على الأذان/);
assert.match(prayerSrc, /تنبيهات الأذان/);

const topBar = readFileSync(resolve(appRoot, "src/components/TopSectionBar.tsx"), "utf8");
assert.match(topBar, /isImmersiveChromePath/);
assert.equal(topBar.includes("isPrayerTimesPath"), false, "TopSectionBar لا يُخفى على الصلاة");

const appSrc = readFileSync(resolve(appRoot, "src/App.tsx"), "utf8") + "\n" + readFileSync(resolve(appRoot, "src/AppRoutes.tsx"), "utf8");
assert.match(appSrc, /quran-hub"><SafeLazyRoute component=\{QuranHubPage\}/);
assert.match(appSrc, /MushafReaderPage/);
assert.equal(appSrc.includes("MushafPageView"), false, "قارئ المصحف القديم أُزيل");
assert.equal(appSrc.includes("MushafComingSoonPage"), false, "صفحة قيد التطوير أُزيلت من المسار");
assert.match(appSrc, /isImmersiveChromePath/);
assert.match(appSrc, /isPrayerTimesPath/);
assert.match(appSrc, /isAuthStandalonePath/);
assert.match(appSrc, /hideSiteChrome/);

const bottomNav = readFileSync(resolve(appRoot, "src/components/BottomNavBar.tsx"), "utf8");
assert.match(bottomNav, /BOTTOM_NAV_TABS/);
assert.match(bottomNav, /isImmersiveChromePath/);
assert.equal(bottomNav.includes("isPrayerTimesPath"), false);

const navMap = readFileSync(resolve(appRoot, "src/lib/nav-map.ts"), "utf8");
assert.match(navMap, /navFor|bottomNavSections/);
assert.match(readFileSync(resolve(appRoot, "src/config/sections.registry.ts"), "utf8"), /route: "\/quran-hub"/);

const navBar = readFileSync(resolve(appRoot, "src/components/NavBar.tsx"), "utf8");
assert.match(navBar, /isImmersiveChromePath\(location\)\) return null/);

const prayerRanks = readFileSync(resolve(appRoot, "src/pages/worship/ui/PrayerRanksView.tsx"), "utf8");
assert.equal(prayerRanks.includes("SectionQuiz"), false, "مراتب الصلاة بلا SectionQuiz");

const quranHub = readFileSync(resolve(appRoot, "src/pages/quran/ui/QuranHubView.tsx"), "utf8");
assert.equal(quranHub.includes("SectionQuiz"), false, "مركز القرآن الكريم بلا SectionQuiz");
assert.match(quranHub, /SectionLobby/);
assert.match(quranHub, /فتح المصحف|open-mushaf/);
assert.match(quranHub, /\/mushaf|loadLastPageSync/);
assert.equal(quranHub.includes("قيد التطوير"), false);
assert.equal(/٦٠٤|604\s*صفح/.test(quranHub), false, "بلا ذكر لعدد صفحات المصحف");

const mushafView = readFileSync(resolve(appRoot, "src/pages/quran/MushafReaderPage.tsx"), "utf8");
assert.match(mushafView, /MushafViewport/);
assert.match(mushafView, /page=/);

const servicesNav = readFileSync(resolve(appRoot, "src/lib/services-center-nav.ts"), "utf8");
assert.match(servicesNav, /sections\.registry/);
assert.match(readFileSync(resolve(appRoot, "src/config/sections.registry.ts"), "utf8"), /quran\/recitation-test-ai/);
assert.match(quranHub, /SectionLobby/);

const globalBack = readFileSync(resolve(appRoot, "src/components/FloatingBackButton.tsx"), "utf8");
assert.match(globalBack, /isImmersiveChromePath/);

const featureIdx = readFileSync(resolve(appRoot, "src/features/mushaf-madinah/index.ts"), "utf8");
assert.match(featureIdx, /MushafPage/);
assert.match(featureIdx, /MushafViewport/);
assert.match(featureIdx, /MushafControls/);

console.log("immersive-chrome.test.ts: ok");
import "./clean-lesson-display-title.test.ts";
import "./teachers-routes.test.ts";
import "./lessons-archive-route.test.ts";
import "./format-lesson-appointment.test.ts";
