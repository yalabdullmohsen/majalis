/**
 * بوابة أسهم التقليب (MushafPageNavigation) + وضع القراءة الكامل.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-arrows-focus-mode-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const nav = read("src/features/mushaf-reader/MushafPageNavigation.tsx");
const controls = read("src/features/mushaf-reader/MushafControlsLayer.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const prefs = read("src/features/mushaf-reader/mushaf-page-arrows-prefs.ts");
const pager = read("src/features/mushaf-reader/MushafPager.tsx");
const pagerHook = read("src/features/mushaf-reader/useMushafPager.ts");

assert.match(nav, /MushafPageNavigation/);
assert.match(nav, /nm-page-arrow--next/);
assert.match(nav, /nm-page-arrow--prev/);
assert.match(nav, /aria-label="الصفحة التالية"/);
assert.match(nav, /aria-label="الصفحة السابقة"/);
assert.match(nav, /MUSHAF_PAGE_MIN|page <= MUSHAF_PAGE_MIN/);
assert.match(nav, /MUSHAF_PAGE_MAX|page >= MUSHAF_PAGE_MAX/);
assert.match(nav, /guardRef|runOnce/);
assert.doesNotMatch(nav, /navigator\.vibrate|Haptics|ImpactFeedback/);

assert.match(css, /\.nm-page-arrow--next[\s\S]*inset-inline-start/);
assert.match(css, /\.nm-page-arrow--prev[\s\S]*inset-inline-end/);
assert.match(css, /\.nm-controls--compact/);
assert.match(css, /data-focus-reading/);

assert.match(reader, /MushafPageNavigation/);
assert.doesNotMatch(reader, /MushafPageArrows/);
assert.match(reader, /focusReadingMode/);
assert.match(reader, /pageArrowsEnabled/);
assert.match(reader, /if \(pageTurnLockRef\.current\) return/);
assert.match(reader, /pageTurnLockRef\.current && pendingPageRef\.current != null/);
assert.match(reader, /data-focus-reading=\{focusReadingMode/);
assert.match(reader, /focusReadingModeRef\.current/);
assert.match(reader, /onNext=\{\(\) => \{[\s\S]*go\(page \+ 1\)/);
assert.match(reader, /onPrev=\{\(\) => \{[\s\S]*go\(page - 1\)/);
assert.match(reader, /disabled=\{edgesDisabled\}/);
assert.doesNotMatch(reader, /navigator\.vibrate/);
assert.doesNotMatch(reader, /disabled=\{edgesDisabled \|\| !pagerSettled\}/);
assert.doesNotMatch(reader, /mushaf-turn-debug/);
assert.match(controls, /mushaf-focus-reading-toggle/);
assert.match(controls, /nm-controls--compact/);
assert.match(controls, /إخفاء أدوات المصحف|وضع القراءة|قراءة/);
assert.match(controls, /إظهار أسهم تقليب الصفحات/);
assert.match(controls, /mushaf-page-arrows-toggle/);

assert.match(prefs, /sunnah\.mushaf\.pageArrowsEnabled/);
assert.match(prefs, /loadPageArrowsEnabled/);
assert.match(prefs, /savePageArrowsEnabled/);
assert.match(prefs, /saveFocusReadingModePreference/);

assert.match(reader, /onPageArrowsEnabledChange|savePageArrowsEnabled/);
assert.match(pager, /nm-page-arrows|nm-page-navigation/);
assert.doesNotMatch(pager, /mm-page-edge/);
assert.match(pagerHook, /dx > 0/);
assert.doesNotMatch(pagerHook, /relX\s*>=\s*0\.85/);

assert.doesNotMatch(nav, /MushafPage\.tsx|nm-line|fontSize|lineHeight/);
assert.doesNotMatch(reader, /--mushaf-font-size:\s*(?!24px)/);

console.log("mushaf-page-arrows-focus-mode-gate.test.ts: ok");
