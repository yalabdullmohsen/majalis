/**
 * بوابة أداء الجوال — منع رجوع تعليق المصحف والكروم والتحميل الثقيل.
 * تشغيل: node --import tsx src/lib/__tests__/mobile-perf-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const pager = read("src/features/mushaf-reader/useMushafPager.ts");
const mushafPager = read("src/features/mushaf-reader/MushafPager.tsx");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const mushafPage = read("src/features/mushaf-reader/MushafPage.tsx");
const overlay = read("src/features/mushaf-reader/AyahSelectionOverlay.tsx");
const fontHook = read("src/features/mushaf-madinah/useQpcPageFont.ts");
const readerCss = read("src/features/mushaf-reader/mushaf-reader.css");
const chromeCss = read("src/styles/components/app-chrome-scroll.css");
const app = read("src/App.tsx");
const appRoutes = read("src/AppRoutes.tsx");
const hadithCss = read("src/styles/pages/hadith.css");
const autoHide = read("src/hooks/useAutoHideBottomNav.ts");

assert.match(pager, /onPanStart/);
assert.match(pager, /onPagerSettled/);
assert.match(pager, /data-panning/);
assert.match(pager, /widthRef\.current <= 0/);
assert.doesNotMatch(pager, /scrollIntoView/);
assert.match(mushafPager, /onPanStart/);
assert.match(mushafPager, /onPagerSettled/);
assert.match(reader, /handlePanStart/);
assert.match(reader, /handlePagerSettled/);
assert.match(reader, /CurrentMushafPageSlot/);
assert.match(reader, /AdjacentPrefetchPage/);
assert.match(reader, /onPageNumberPress = useCallback/);
assert.match(reader, /bootstrapPage1:\s*true/);
assert.match(reader, /prefetchNeighbors:\s*false/);
assert.doesNotMatch(reader, /requestAnimationFrame\(\(\) => setPagerSettled\(true\)\)/);
assert.match(mushafPage, /memo\(function MushafPage/);
assert.match(mushafPage, /containerRef={bodyRef}/);
assert.doesNotMatch(mushafPage, /setBodyEl/);
assert.match(overlay, /containerRef/);
assert.match(fontHook, /prefetchNeighbors/);
assert.match(readerCss, /data-panning="1"/);
assert.match(readerCss, /will-change:\s*transform/);

assert.match(chromeCss, /cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/);
assert.match(chromeCss, /200ms/);
assert.match(chromeCss, /max-height:\s*0/);
assert.doesNotMatch(
  chromeCss.replace(/\/\*[\s\S]*?\*\//g, ""),
  /\.app-shell\.app-chrome-hidden[\s\S]*?height:\s*0\s*!important/,
);
assert.doesNotMatch(chromeCss.replace(/\/\*[\s\S]*?\*\//g, ""), /display\s*:\s*none/);
assert.match(autoHide, /requestAnimationFrame/);

assert.match(app, /DeferredQuranMiniPlayer/);
assert.match(app, /subscribeMiniPlayer/);
assert.match(app, /isMiniPlayerVisible/);
assert.match(appRoutes, /lazy\(\(\)\s*=>\s*import\("@\/pages\/quran\/MushafReaderPage"\)/);
assert.match(appRoutes, /lazy\(\(\)\s*=>\s*import\("@\/pages\/fiqh\/FiqhPage"\)/);
assert.match(appRoutes, /lazy\(\(\)\s*=>\s*import\("@\/pages\/lessons\/LessonsPage"\)/);
assert.match(appRoutes, /lazy\(\(\)\s*=>\s*import\("@\/pages\/hadith\/HadithPage"\)/);
assert.match(appRoutes, /lazy\(\(\)\s*=>\s*import\("@\/pages\/account\/SearchPage"\)/);
assert.match(appRoutes, /lazy\(\(\)\s*=>\s*import\("@\/pages\/account\/SettingsPage"\)/);

assert.doesNotMatch(hadithCss, /backdrop-filter:\s*blur\(/);

console.log("mobile-perf-gate.test.ts: ok");
