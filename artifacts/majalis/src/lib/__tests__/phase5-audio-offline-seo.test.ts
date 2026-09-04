/**
 * بوابة المرحلة 5: مشغّل عالمي + متابعة محلية + SWR/PWA + SEO منظم.
 * تشغيل: node --import tsx src/lib/__tests__/phase5-audio-offline-seo.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { surahJsonLd, bookJsonLd, personJsonLd } from "../seo-structured-data";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../../");
const src = resolve(root, "src");

function read(rel: string) {
  return readFileSync(resolve(src, rel), "utf8");
}

function readRoot(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

// ── Audio engine + mini player ──────────────────────────────────────────────
const engine = read("core/audio/AudioEngine.ts");
assert.match(engine, /async skipNext\(/);
assert.match(engine, /async skipPrev\(/);
assert.match(engine, /cycleMiniPlayerRate\(/);
assert.match(engine, /showMiniPlayer/);
assert.match(engine, /lastTimeEmitMs/);

const mini = read("components/quran/QuranMiniPlayerBar.tsx");
assert.match(mini, /skipNext/);
assert.match(mini, /skipPrev/);
assert.match(mini, /cycleMiniPlayerRate/);
assert.match(mini, /quran-mini-player__range/);
assert.match(mini, /onNext:/);
assert.match(mini, /onPrevious:/);

const app = read("App.tsx") + "\n" + read("AppRoutes.tsx");
assert.match(app, /QuranMiniPlayerBar/);

// ── Local resume on home ────────────────────────────────────────────────────
assert.ok(existsSync(resolve(src, "components/home/HomeLocalResumeCard.tsx")));
const home = read("pages/account/ui/HomeView.tsx") + read("pages/account/ui/HomeBelowFold.tsx");
assert.match(home, /HomeLocalResumeCard/);
assert.match(home, /متابعة القراءة والاستماع|متابعة/);

const resume = read("components/home/HomeLocalResumeCard.tsx");
assert.match(resume, /loadPagePosition/);
assert.match(resume, /loadAudioResumeState/);
assert.match(resume, /getContinueReadingEntries/);
assert.match(resume, /adhkar:/);

// ── PWA / SWR ───────────────────────────────────────────────────────────────
const sw = readFileSync(resolve(root, "public/sw.js"), "utf8");
assert.match(sw, /function staleWhileRevalidate/);
assert.match(sw, /function networkFirstThenCache/);
assert.match(sw, /networkFirstThenCache\(req, DATA_CACHE\)/);
assert.match(sw, /pathname === "\/version\.json"/);
{
  const shell = sw.match(/const STATIC_SHELL_ASSETS = \[([\s\S]*?)\];/)?.[1] ?? "";
  assert.doesNotMatch(shell, /sw-version/, "sw-version.js لا يُسبق في STATIC_SHELL");
}
assert.ok(existsSync(resolve(root, "public/manifest.json")));
assert.ok(existsSync(resolve(root, "public/site.webmanifest")));

// ── SEO helpers + wiring ────────────────────────────────────────────────────
const surahLd = surahJsonLd({
  number: 2,
  name: "البقرة",
  url: "/mushaf/page/2",
  ayahCount: 286,
});
assert.equal(surahLd["@type"], "CreativeWork");
assert.match(String(surahLd.name), /البقرة/);

// المساعد bookJsonLd يبقى للدروس/الفقه — بلا مسارات مكتبة عامة
const bookLd = bookJsonLd({
  name: "عمدة الأحكام",
  url: "/fiqh/books/taharah",
  author: "عبد الغني المقدسي",
});
assert.equal(bookLd["@type"], "Book");
assert.doesNotMatch(String(bookLd.url ?? bookLd["@id"] ?? ""), /\/library\//);

const personLd = personJsonLd({
  name: "الطبري",
  url: "/tarikh-islami/abbasid-house-of-wisdom",
  knowsAbout: ["تاريخ"],
});
assert.equal(personLd["@type"], "Person");

// ── المكتبة العامة أُزيلت رسميًا — بوابة عدم التسرب ─────────────────────────
{
  const libraryDetail = read("pages/library/ui/LibraryDetailView.tsx");
  assert.doesNotMatch(libraryDetail, /bookJsonLd\(/, "LibraryDetailView بلا bookJsonLd");
  assert.doesNotMatch(libraryDetail, /applyPageSeo/, "لا SEO مستقل لتفاصيل المكتبة");
  assert.match(libraryDetail, /Redirect/);
  assert.match(libraryDetail, /\/search/);
  assert.doesNotMatch(libraryDetail, /cover_url|image_url/);

  const routes = read("AppRoutes.tsx");
  assert.match(
    routes,
    /path=["']\/library["'][^>]*>\s*<Redirect\s+to=["']\/search["']/,
    "/library → /search في التوجيه",
  );
  assert.match(
    routes,
    /path=["']\/library\/:id["'][^>]*>\s*<Redirect\s+to=["']\/search["']/,
    "/library/:id → /search في التوجيه",
  );
  assert.doesNotMatch(routes, /LibraryPage|LibraryDetailPage/, "لا صفحات مكتبة علنية مُركَّبة");

  const vercel = readRoot("vercel.json");
  assert.match(
    vercel,
    /"source"\s*:\s*"\/library"\s*,\s*"destination"\s*:\s*"\/search"/,
    "vercel: /library → /search دائم",
  );
  assert.match(
    vercel,
    /"source"\s*:\s*"\/library\/:path\*"\s*,\s*"destination"\s*:\s*"\/search"/,
    "vercel: /library/* → /search",
  );

  const sitemap = readRoot("public/sitemap.xml");
  assert.doesNotMatch(sitemap, /\/library(\/|"|<)/, "sitemap بلا مسارات مكتبة");

  const nav = read("config/navigation.ts");
  assert.doesNotMatch(nav, /["']\/library["']/, "التنقل الأساسي بلا /library");
  assert.doesNotMatch(nav, /المكتبة العلمية/);

  const homeView = read("pages/account/ui/HomeView.tsx") + read("pages/account/ui/HomeBelowFold.tsx");
  assert.doesNotMatch(homeView, /href=["']\/library/, "الرئيسية بلا بطاقات مكتبة");
  assert.doesNotMatch(homeView, /المكتبة العلمية/);

  const searchApi = readRoot("lib/api-handlers/search.js");
  assert.match(searchApi, /المكتبة العامة أُزيلت|لا نتائج \/library/, "البحث العام لا يُرجع /library");

  const generateSeo = readRoot("scripts/generate-seo.mjs");
  assert.match(
    generateSeo,
    /for\s*\(\s*const\s+row\s+of\s+\[\s*\]\s*\)|المكتبة أُزيلت من الواجهة العامة/,
    "توليد SEO لا ينشر صفحات مكتبة",
  );
  assert.match(generateSeo, /\/library removed from public SEO|لا نولّد صفحات \/library/);

  // المساعد ما زال دالة قابلة للاستخدام لكتب الفقه وغيرها
  assert.equal(typeof bookJsonLd, "function");
}

const historyDetail = read("views/TarikhIslamiDetailPage.tsx");
assert.match(historyDetail, /applyPageSeo/);
assert.match(historyDetail, /sources/);

const mushaf = read("pages/quran/MushafReaderPage.tsx");
assert.match(mushaf, /applyPageSeo/);
assert.match(mushaf, /MushafViewport/);

console.log("phase5-audio-offline-seo.test.ts: ok");
