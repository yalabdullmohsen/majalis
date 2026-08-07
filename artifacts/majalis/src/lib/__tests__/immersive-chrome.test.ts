/**
 * مسارات الواجهة الغامرة — المصحف واختبار التلاوة بلا شريط مشترك.
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

assert.equal(isQuranImmersivePath("/mushaf"), true);
assert.equal(isQuranImmersivePath("/mushaf/page/1"), true);
assert.equal(isQuranImmersivePath("/quran-hub"), true);
assert.equal(isQuranImmersivePath("/fiqh"), false);

assert.equal(isImmersiveChromePath("/prayer-times"), false, "الصلاة ليست غمرية — الشريط السفلي ظاهر");
// أثناء إيقاف المصحف مؤقتًا («قريبًا») يبقى الشريط ظاهرًا
assert.equal(isImmersiveChromePath("/mushaf"), false);
assert.equal(isImmersiveChromePath("/mushaf/2"), false);
assert.equal(isImmersiveChromePath("/quran/recitation-test-ai"), true);
assert.equal(isImmersiveChromePath("/"), false);
assert.equal(isImmersiveChromePath("/hadith"), false);

const prayerSrc = readFileSync(resolve(appRoot, "src/views/PrayerTimesPage.tsx"), "utf8");
assert.equal(prayerSrc.includes("SectionQuiz"), false, "صفحة الصلاة بلا SectionQuiz");
assert.equal(prayerSrc.includes("categoryId"), false, "صفحة الصلاة لا تحمّل تصنيفات اختبار");
assert.match(prayerSrc, /مضى على الأذان/);
assert.match(prayerSrc, /تنبيهات الأذان/);

const topBar = readFileSync(resolve(appRoot, "src/components/TopSectionBar.tsx"), "utf8");
assert.match(topBar, /isImmersiveChromePath/);

const appSrc = readFileSync(resolve(appRoot, "src/App.tsx"), "utf8");
assert.match(appSrc, /quran-hub"><Redirect to="\/mushaf"/);
assert.match(appSrc, /MushafComingSoonPage/);
assert.equal(appSrc.includes("MushafPageView"), false, "قارئ المصحف غير موصول أثناء الإيقاف المؤقت");
assert.match(appSrc, /isImmersiveChromePath/);

const bottomNav = readFileSync(resolve(appRoot, "src/components/BottomNavBar.tsx"), "utf8");
assert.match(bottomNav, /BOTTOM_NAV_TABS/);
assert.equal(bottomNav.includes('href: "/quran-hub"'), false);
assert.match(bottomNav, /isImmersiveChromePath/);

const navMap = readFileSync(resolve(appRoot, "src/lib/nav-map.ts"), "utf8");
assert.match(navMap, /href: "\/quran-knowledge"/);
assert.equal(navMap.includes('href: "/quran-hub"'), false);

const navBar = readFileSync(resolve(appRoot, "src/components/NavBar.tsx"), "utf8");
assert.match(navBar, /isImmersiveChromePath\(location\)\) return null/);

const prayerRanks = readFileSync(resolve(appRoot, "src/views/PrayerRanksPage.tsx"), "utf8");
assert.equal(prayerRanks.includes("SectionQuiz"), false, "مراتب الصلاة بلا SectionQuiz");

const quranHub = readFileSync(resolve(appRoot, "src/views/QuranHubPage.tsx"), "utf8");
assert.equal(quranHub.includes("SectionQuiz"), false, "مركز القرآن بلا SectionQuiz");

const globalBack = readFileSync(resolve(appRoot, "src/components/GlobalBackButton.tsx"), "utf8");
assert.match(globalBack, /isImmersiveChromePath/);

console.log("immersive-chrome.test.ts: ok");
import "./clean-lesson-display-title.test.ts";
import "./teachers-routes.test.ts";
import "./format-lesson-appointment.test.ts";
