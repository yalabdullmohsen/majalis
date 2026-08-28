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

const app = read("App.tsx");
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

const bookLd = bookJsonLd({
  name: "صحيح البخاري",
  url: "/library/book-bukhari",
  author: "البخاري",
});
assert.equal(bookLd["@type"], "Book");

const personLd = personJsonLd({
  name: "الطبري",
  url: "/tarikh-islami/pers-al-tabari",
  knowsAbout: ["تاريخ"],
});
assert.equal(personLd["@type"], "Person");

const libraryDetail = read("pages/library/ui/LibraryDetailView.tsx");
assert.match(libraryDetail, /bookJsonLd\(/);
assert.doesNotMatch(libraryDetail, /cover_url|image_url/);

const historyDetail = read("views/TarikhIslamiDetailPage.tsx");
assert.match(historyDetail, /applyPageSeo/);
assert.match(historyDetail, /sources/);

const mushaf = read("pages/quran/MushafReaderPage.tsx");
assert.match(mushaf, /applyPageSeo/);
assert.match(mushaf, /MushafViewport/);

console.log("phase5-audio-offline-seo.test.ts: ok");
