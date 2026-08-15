/**
 * مسارات الواجهة الغامرة — المصحف واختبار التسميع بلا شريط مشترك.
 * مركز القرآن بوابة عادية (ليست غمرية).
 * صفحة الصلاة تُبقي الشريط السفلي ظاهرًا (2026-08).
 * تشغيل: npx tsx src/lib/__tests__/immersive-chrome.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isImmersiveChromePath,
  isPrayerTimesPath,
  isQuranImmersivePath,
} from "../immersive-chrome";
import "./get-active-tab.test.ts";
import "./featured-home-status.test.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

assert.equal(isPrayerTimesPath("/prayer-times"), true);
assert.equal(isPrayerTimesPath("/prayer-times/"), true);
assert.equal(isPrayerTimesPath("/fiqh"), false);

assert.equal(isQuranImmersivePath("/mushaf"), false, "المصحف قيد التطوير — ليس غمريًا");
assert.equal(isQuranImmersivePath("/mushaf/page/1"), false);
assert.equal(isQuranImmersivePath("/quran-hub"), false, "مركز القرآن ليس غمريًا");
assert.equal(isQuranImmersivePath("/fiqh"), false);

assert.equal(isImmersiveChromePath("/prayer-times"), false, "الصلاة ليست غمرية كاملة — الشريط السفلي وشريط الأقسام ظاهران");
assert.equal(isImmersiveChromePath("/mushaf"), false, "صفحة قيد التطوير تظهر الشريط السفلي");
assert.equal(isImmersiveChromePath("/mushaf/2"), false);
assert.equal(isImmersiveChromePath("/quran-hub"), false, "مركز القرآن يظهر الشريط السفلي");
assert.equal(isImmersiveChromePath("/quran/recitation-test-ai"), true);
assert.equal(isImmersiveChromePath("/"), false);
assert.equal(isImmersiveChromePath("/hadith"), false);

const prayerSrc = readFileSync(resolve(appRoot, "src/pages/worship/ui/PrayerTimesView.tsx"), "utf8");
assert.equal(prayerSrc.includes("SectionQuiz"), false, "صفحة الصلاة بلا SectionQuiz");
assert.equal(prayerSrc.includes("categoryId"), false, "صفحة الصلاة لا تحمّل تصنيفات اختبار");
assert.match(prayerSrc, /مضى على الأذان/);
assert.match(prayerSrc, /تنبيهات الأذان/);

const topBar = readFileSync(resolve(appRoot, "src/components/TopSectionBar.tsx"), "utf8");
assert.match(topBar, /isImmersiveChromePath/);
assert.equal(topBar.includes("isPrayerTimesPath"), false, "TopSectionBar لا يُخفى على الصلاة");

const appSrc = readFileSync(resolve(appRoot, "src/App.tsx"), "utf8");
assert.match(appSrc, /quran-hub"><SafeLazyRoute component=\{QuranHubPage\}/);
assert.match(appSrc, /MushafComingSoonPage/);
assert.equal(appSrc.includes("MushafPageView"), false, "قارئ المصحف القديم أُزيل");
assert.match(appSrc, /isImmersiveChromePath/);
assert.match(appSrc, /isPrayerTimesPath/);
assert.match(appSrc, /hideSiteChrome/);

const bottomNav = readFileSync(resolve(appRoot, "src/components/BottomNavBar.tsx"), "utf8");
assert.match(bottomNav, /BOTTOM_NAV_TABS/);
assert.match(bottomNav, /isImmersiveChromePath/);
assert.equal(bottomNav.includes("isPrayerTimesPath"), false);

const navMap = readFileSync(resolve(appRoot, "src/lib/nav-map.ts"), "utf8");
assert.match(navMap, /href: "\/mushaf"/);

const navBar = readFileSync(resolve(appRoot, "src/components/NavBar.tsx"), "utf8");
assert.match(navBar, /isImmersiveChromePath\(location\) \|\| isPrayerTimesPath\(location\)\) return null/);
assert.match(navBar, /isPrayerTimesPath/);

const prayerRanks = readFileSync(resolve(appRoot, "src/pages/worship/ui/PrayerRanksView.tsx"), "utf8");
assert.equal(prayerRanks.includes("SectionQuiz"), false, "مراتب الصلاة بلا SectionQuiz");

const quranHub = readFileSync(resolve(appRoot, "src/pages/quran/ui/QuranHubView.tsx"), "utf8");
assert.equal(quranHub.includes("SectionQuiz"), false, "مركز القرآن بلا SectionQuiz");
assert.match(quranHub, /التسميع/);
assert.match(quranHub, /\/quran\/recitation-test-ai/);

const mushafView = readFileSync(resolve(appRoot, "src/pages/quran/MushafComingSoonPage.tsx"), "utf8");
assert.match(mushafView, /قيد التطوير/);

const servicesNav = readFileSync(resolve(appRoot, "src/lib/services-center-nav.ts"), "utf8");
assert.match(servicesNav, /href: "\/nations"/);
assert.match(servicesNav, /href: "\/quran-hub"/);
assert.match(servicesNav, /href: "\/quran\/recitation-test-ai"/);

const globalBack = readFileSync(resolve(appRoot, "src/components/GlobalBackButton.tsx"), "utf8");
assert.match(globalBack, /isImmersiveChromePath/);

console.log("immersive-chrome.test.ts: ok");
import "./clean-lesson-display-title.test.ts";
import "./teachers-routes.test.ts";
import "./lessons-archive-route.test.ts";
import "./format-lesson-appointment.test.ts";
