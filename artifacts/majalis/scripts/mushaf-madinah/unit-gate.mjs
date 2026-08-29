#!/usr/bin/env node
/** بوابة وحدات للمصحف الموثّق — VerifiedMushafReader */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");

const comps = [
  "src/features/mushaf-madinah/MushafPage.tsx",
  "src/features/mushaf-madinah/VerifiedMushafReader.tsx",
  "src/features/mushaf-madinah/MushafPager.tsx",
  "src/features/mushaf-madinah/AyahActionSheet.tsx",
  "src/features/mushaf-madinah/MushafSearchSheet.tsx",
  "src/features/mushaf-madinah/MushafPageHeader.tsx",
  "src/features/mushaf-madinah/MushafSurahOrnament.tsx",
  "src/features/mushaf-madinah/MushafAyahLine.tsx",
  "src/features/mushaf-madinah/MushafAyahNumber.tsx",
  "src/features/mushaf-madinah/MushafPageFooter.tsx",
  "src/features/mushaf-madinah/MushafControls.tsx",
];
for (const c of comps) assert.ok(existsSync(resolve(root, c)), c);

const lineSrc = read("src/features/mushaf-madinah/MushafAyahLine.tsx");
assert.match(lineSrc, /a\.id\s*-\s*b\.id/);
assert.doesNotMatch(lineSrc, /\.sort\(\(a,\s*b\)\s*=>\s*a\.position\s*-\s*b\.position\)\s*;/);

const dataSrc = read("src/lib/quran-data/qpc-page-data.ts");
assert.match(dataSrc, /words\.sort\(\(a,\s*b\)\s*=>\s*a\.id/);
assert.match(dataSrc, /LAYOUT_CACHE_MAX/);
assert.match(dataSrc, /getCachedMushafPage/);
assert.match(dataSrc, /prefetchMushafPage[\s\S]{0,500}loadMushafPage/);

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
assert.match(css, /--mm-paper/);
assert.match(css, /--mm-gold/);
assert.match(css, /\.mm-page__body/);
assert.match(css, /\.mm-ayah-bar/);
assert.match(css, /--mm-ayah-select:\s*#eedcc2/);
assert.match(css, /--mm-ayah-select:\s*rgba\(45,\s*38,\s*30,\s*0\.72\)/);
assert.match(css, /--mm-ui-accent:\s*#135034/);
assert.match(css, /--mm-header:\s*#4a4a4a/);
assert.match(css, /--mm-gold-deep:\s*#785e38/);
assert.match(css, /border-radius:\s*9999px/);
assert.match(css, /\.mm-ayah-hl__band/);
assert.doesNotMatch(css, /\.mm-ayah-sheet__backdrop/);
assert.doesNotMatch(css, /\.mm-page__frame\s*\{[^}]*border:\s*1px/);
assert.match(css, /html\[data-theme="dark"\]\s*\.mm-viewport/);
assert.match(css, /\.mm-page-edge/);
assert.match(css, /#152018|#101812|#0e1410|#1c2430|#151c26|#101820|#0f1720|#0c1218/);
assert.match(css, /\.mm-ayah-run__text\.is-selected/);
assert.match(css, /\.mm-ayah-bar__dismiss\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.28\)/);
assert.match(css, /\.mm-viewport\s+\.mm-page\s*\{[^}]*box-shadow:\s*none/);
assert.match(css, /\.mm-basmala\s*\{[^}]*font-size:\s*var\(--mm-qpc-size\)/);
assert.match(css, /\.mm-reciter-sheet/);
assert.match(css, /--mm-outer-pad:\s*0/);
assert.match(css, /--mm-chrome-top-h/);
assert.match(css, /--mm-chrome-bottom-h/);
assert.match(css, /\.mm-ayah-bar__handle/);
assert.match(css, /height:\s*140px/);
assert.match(css, /height:\s*50dvh/);
assert.match(css, /height:\s*90dvh/);
assert.match(css, /z-index:\s*9999/);
assert.match(css, /--mm-ref-text-start:\s*11\.5%/);
assert.match(css, /--mm-ref-text-end:\s*91\.6%/);
assert.doesNotMatch(css, /aspect-ratio:\s*0\.68/);
assert.match(css, /overflow-y:\s*hidden/);
assert.match(css, /overflow-x:\s*(hidden|clip)/);
assert.match(css, /\.mushaf-page-frame|\.mushaf-shell/);
assert.match(css, /--mm-page-max-w:\s*min\(100%/);
assert.doesNotMatch(css, /background:\s*#000\b/);
const ayahBlock = css.match(/\.mm-ayah-line\s*\{[^}]+\}/)?.[0] ?? "";
assert.ok(ayahBlock.includes("letter-spacing: 0") || !/letter-spacing\s*:/.test(ayahBlock));
assert.ok(ayahBlock.includes("word-spacing: 0") || !/word-spacing\s*:/.test(ayahBlock));
assert.doesNotMatch(ayahBlock, /letter-spacing:\s*[1-9]/);
assert.doesNotMatch(ayahBlock, /word-spacing:\s*[1-9]/);
assert.match(ayahBlock, /bidi-override/);

const viewport = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
assert.match(viewport, /AyahActionSheet|MushafAyahActions/);
assert.match(viewport, /MushafTafsirSheet/);
assert.match(viewport, /MushafAudioDock/);
assert.match(viewport, /MushafPager/);
assert.match(viewport, /getCachedMushafPage\(page\)/);
assert.match(viewport, /playAyah|togglePlay/);
assert.match(viewport, /onShare|navigator\.share/);
assert.match(viewport, /exitAlwaysVisible=\{actionsOpen\s*\|\|\s*chromeOpen\s*\|\|\s*overlayOpen\}/);
assert.doesNotMatch(viewport, /exitAlwaysVisible=\{true\}/);
assert.match(viewport, /suppressPageSyncRef/);
assert.match(viewport, /useMediaSession/);
assert.match(viewport, /اختر آية أولاً/);
assert.match(viewport, /setActionsOpen\(false\)/);
assert.match(viewport, /onPrevAyah|skipPrev/);
assert.match(viewport, /addEventListener\("scroll"/);
assert.match(viewport, /MUSHAF_CHROME_HIDE_MS|3200/);
assert.doesNotMatch(viewport, /تعذّرت المشاركة/);

const pager = read("src/features/mushaf-madinah/MushafPager.tsx");
assert.match(pager, /dx > 0/);
assert.match(pager, /go\(page \+ 1\)/);
assert.match(pager, /SWIPE_MIN_PX\s*=\s*40/);
assert.match(pager, /SETTLE_MS\s*=\s*250/);
assert.match(pager, /prefers-reduced-motion/);
assert.match(pager, /scroll-snap|data-snap/);
assert.doesNotMatch(pager, /rotateY/);

const controls = read("src/features/mushaf-madinah/MushafControls.tsx");
assert.match(controls, /exitAlwaysVisible/);
assert.match(controls, /showExit\s*=\s*open\s*\|\|\s*exitAlwaysVisible/);
assert.match(controls, /mm-controls__exit/);
assert.match(controls, /data-exit=\{showExit/);
assert.match(controls, /× خروج/);
assert.match(controls, /\{pageNumber\} \/ \{MUSHAF_PAGE_MAX\}/);
assert.match(controls, /onSearch|بحث/);
assert.match(controls, /فهرس/);

assert.match(pager, /ArrowRight|ArrowLeft/, "أسهم لوحة المفاتيح");

const actions = read("src/features/mushaf-madinah/AyahActionSheet.tsx");
assert.match(actions, /mm-reciter-sheet/);
assert.match(actions, /مشاركة|onShare/);
assert.match(actions, /SkipBack|onPrevAyah/);
assert.match(actions, /useVerifiedReciters/);
assert.match(actions, /mm-ayah-bar__handle/);
assert.match(actions, /جاري التحميل|جاري تحميل التلاوة/);
assert.match(actions, /mushaf-ayah-play/);
assert.match(actions, /سورة|آية/);
assert.match(actions, /استماع|تفسير/);
assert.match(actions, /تلاوة|Headphones/);
assert.doesNotMatch(actions, /المزيد/);
assert.match(actions, /data-sheet-height/);

const dock = read("src/features/mushaf-madinah/MushafAudioDock.tsx");
assert.match(dock, /useVerifiedReciters/);
assert.match(dock, /DEFAULT_VERIFIED_RECITER_IDS/);
assert.match(read("src/lib/audio-registry.ts"), /"alafasy"/);
assert.match(read("src/lib/audio-registry.ts"), /"husary"/);
assert.match(read("src/lib/audio-registry.ts"), /"minshawi"/);

const ornament = read("src/features/mushaf-madinah/MushafSurahOrnament.tsx");
assert.match(ornament, /mm-surah-frame/);
assert.doesNotMatch(ornament, /<svg/i);

assert.match(css, /\.mm-surah-frame\s*\{[^}]*border:\s*1px/);
assert.match(css, /inset-inline-end:\s*0/);
assert.match(css, /scrollbar-width:\s*none/);

const pageSrc = read("src/features/mushaf-madinah/MushafPage.tsx");
assert.match(pageSrc, /bismillahPre/);
assert.match(pageSrc, /MushafBasmala/);
assert.match(pageSrc, /filledSlots|mm-page__body--opening/);
assert.doesNotMatch(pageSrc, /inlineBasmala/);
assert.doesNotMatch(pageSrc, /mm-slot__banner--with-basmala/);
assert.match(pageSrc, /النمل/);
assert.ok(existsSync(resolve(root, "src/features/mushaf-madinah/MushafBasmala.tsx")));
assert.match(read("src/features/mushaf-madinah/MushafBasmala.tsx"), /BASMALA_QPC_WORDS/);
assert.match(read("src/features/mushaf-madinah/useMushafPageFontFit.ts"), /fitPageFontSize/);
assert.match(read("src/features/mushaf-madinah/useMushafPageFontFit.ts"), /document\.fonts\.ready/);
assert.match(read("src/features/mushaf-madinah/useMushafPageFontFit.ts"), /document\.fonts\.check/);
assert.match(read("src/features/mushaf-madinah/MushafPage.tsx"), /hizbStartingOnPage/);

const line = read("src/features/mushaf-madinah/MushafAyahLine.tsx");
assert.match(line, /onSelectVerse/);
assert.match(line, /mm-ayah-hit/);
assert.match(line, /data-type=\{(w|word)\.charType\}/);
assert.match(line, /charType === "end"/);
assert.match(line, /stopPropagation/);
assert.match(line, /LONG_PRESS_MS/);
assert.match(line, /data-testid="mushaf-ayah-hit"/);

const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
assert.match(app, /MushafReaderPage/);
assert.doesNotMatch(app, /MushafComingSoonPage/);
assert.doesNotMatch(app, /demo-ayah-reader(?!.*Redirect)/);

const page = read("src/pages/quran/MushafReaderPage.tsx");
assert.match(page, /NewMushafReader|VerifiedMushafReader|MushafViewport/);
assert.match(page, /features\/mushaf-reader/);
assert.doesNotMatch(page, /\.pdf/i);

assert.ok(existsSync(resolve(root, "public/fonts/qpc-v2/p1.woff2")));
assert.ok(existsSync(resolve(root, "public/data/quran-v2/pages/page-001.json")));

console.log("✓ mushaf-gates:unit ok");
