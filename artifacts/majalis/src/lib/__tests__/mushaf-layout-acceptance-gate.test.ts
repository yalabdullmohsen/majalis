/**
 * قبول تخطيط المصحف بعد إصلاح القص/التراكب.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-layout-acceptance-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fitMushafPageFont } from "../../features/mushaf-madinah/useMushafPageFontFit";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const page = read("src/features/mushaf-madinah/MushafPage.tsx");
const viewport = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
const actions = read("src/features/mushaf-madinah/AyahActionSheet.tsx");
const fitSrc = read("src/features/mushaf-madinah/useMushafPageFontFit.ts");

// 1) لا إطار 0.68 ولا عرض 100vw يسبب قصًا
assert.doesNotMatch(css, /aspect-ratio:\s*0\.68/);
assert.doesNotMatch(css, /\.mm-page-shell[^{]*\{[^}]*width:\s*min\(100vw/);
assert.match(css, /--mm-page-max-w:\s*min\(100%/);
assert.match(css, /overflow-x:\s*clip/);
assert.match(css, /100svh/);

// 2) شريط الآية لا يقلّص الصفحة بارتفاع 8rem
assert.doesNotMatch(
  css,
  /data-ayah-bar="1"\][^{]*\{[^}]*--mm-chrome-bottom-h:\s*var\(--mm-ayah-bar-h\)/,
);
assert.match(css, /\.mm-ayah-bar__dismiss\s*\{[^}]*background:\s*transparent|rgba\(0,\s*0,\s*0,\s*0\.28\)/);

// 3) لا تظليل multiply يعتّم النص
assert.doesNotMatch(css, /mix-blend-mode:\s*multiply/);

// 4) خط QPC + ملاءمة الحجم
assert.match(page, /useMushafPageFontFit/);
assert.match(fitSrc, /fitMushafPageFont/);
assert.match(fitSrc, /resolveUniformMushafFontSize/);
assert.match(css, /--mm-qpc-size:\s*clamp/);
assert.doesNotMatch(css, /transform:\s*scale\(/);

// 5) التلاوة والتفسير من الشيت
assert.match(actions, /mushaf-ayah-play/);
assert.match(actions, /onTafsir|تفسير/);
assert.match(actions, /onReciterChange|القارئ/);
assert.match(actions, /data-sheet-height|is-expanded/);
assert.match(viewport, /playAyah|playSelected/);
assert.match(viewport, /MushafTafsirSheet/);
assert.match(viewport, /useMediaSession/);
assert.match(viewport, /exitAlwaysVisible=\{actionsOpen\s*\|\|\s*chromeOpen\s*\|\|\s*overlayOpen\}/);
assert.doesNotMatch(viewport, /exitAlwaysVisible=\{true\}/);
assert.match(fitSrc, /document\.fonts\.(check|load)/);
assert.match(fitSrc, /loadingdone|orientationchange/);

// 6) وحدة الملاءمة لا ترمي
const fake = {
  style: {
    removeProperty() {},
    setProperty() {},
  },
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [] as unknown as NodeListOf<HTMLElement>;
  },
} as unknown as HTMLElement;
assert.doesNotThrow(() => fitMushafPageFont(fake));

console.log("mushaf-layout-acceptance-gate.test.ts: ok");
