#!/usr/bin/env node
/**
 * بوابة التخطيط البسيط للمصحف (حاجبة في unit):
 * - بلا position:absolute على .mf2-grid-slot / .mf2-line (CSS + slotStyle)
 * - data-mushaf-grid=flow
 * - SurahBanner: data-ornament=none
 * - مؤشر الخط corner (بلا شريط علوي)
 * - بلا أرابيسك في شجرة الصفحة
 *
 *   node scripts/quran-import/mushaf-minimal-layout-gate.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

const failures = [];

const pageV2 = read("src/components/quran/MushafPageV2.tsx");
const banner = read("src/components/quran/SurahBanner.tsx");
const fontBanner = read("src/components/quran/QpcFontPackBanner.tsx");
const fontCss = read("src/styles/components/qpc-font-pack-banner.css");
const mushafCss = read("src/styles/mushaf-v2.css");
const view = read("src/pages/quran/ui/MushafPageView.tsx");
const baseline = JSON.parse(read("src/features/mushaf/mushaf-baseline.json"));

if (!/data-mushaf-grid="flow"/.test(pageV2)) {
  failures.push("MushafPageV2 بلا data-mushaf-grid=flow");
}
if (!/data-board="1000x1618"/.test(pageV2)) {
  failures.push("MushafPageV2 بلا data-board=1000x1618");
}
if (!/grid-template-rows:\s*repeat\(15/.test(mushafCss)) {
  failures.push("mushaf-v2.css بلا grid-template-rows: repeat(15)");
}
if (!/aspect-ratio:\s*1000\s*\/\s*1618/.test(mushafCss)) {
  failures.push("لوحة منطقية 1000×1618 مفقودة من .mf2-frame");
}

const slotStyleBlock = pageV2.match(/const slotStyle[\s\S]*?return \{[\s\S]*?\};/)?.[0] || "";
if (/position:\s*["']absolute["']/.test(slotStyleBlock)) {
  failures.push("slotStyle يضع position:absolute على الخانات");
}
if (!/position:\s*["']relative["']/.test(slotStyleBlock)) {
  failures.push("slotStyle بلا position:relative");
}

/* CSS: لا absolute على .mf2-grid-slot أو .mf2-line كقاعدة */
const gridSlotRule = mushafCss.match(/\.mf2-grid-slot\s*\{[^}]*\}/)?.[0] || "";
const lineRule = mushafCss.match(/(?:^|\n)\.mf2-line\s*\{[^}]*\}/)?.[0] || "";
if (/position:\s*absolute/.test(gridSlotRule)) {
  failures.push(".mf2-grid-slot CSS يستخدم position:absolute");
}
if (/position:\s*absolute/.test(lineRule)) {
  failures.push(".mf2-line CSS يستخدم position:absolute");
}

if (!/data-ornament="none"/.test(banner)) {
  failures.push("SurahBanner بلا data-ornament=none");
}
if (!/data-banner-style="minimal-rule"/.test(banner)) {
  failures.push("SurahBanner بلا data-banner-style=minimal-rule");
}
if (/PetalMedallion|data-wing-part|wing-refined|Arabesque|arabesque/.test(banner)) {
  failures.push("SurahBanner ما زال يحمل زخرفة جناح/أرابيسك");
}

if (!/data-font-progress="corner"/.test(fontBanner)) {
  failures.push("QpcFontPackBanner بلا data-font-progress=corner");
}
if (!/qpc-font-pack--corner/.test(fontBanner)) {
  failures.push("QpcFontPackBanner بلا صنف corner");
}
if (/qpc-font-pack--top|data-font-progress="top"/.test(fontBanner + fontCss)) {
  failures.push("مؤشر الخط ما زال يستخدم شريطًا علويًا");
}

const tree = pageV2 + banner + view + mushafCss;
if (/mf2-arabesque|arabesque-frame|ArabesqueMesh|data-wing-density|wing-refined/.test(tree)) {
  failures.push("مرجع لزخارف أرابيسك/جناح محذوفة في شجرة الصفحة");
}
if (existsSync(join(ROOT, "src/components/quran/OpeningPageFrame.tsx"))) {
  failures.push("OpeningPageFrame.tsx ما زال موجودًا");
}
if (/OPENING_BANNER_TOP_PCT/.test(pageV2)) {
  failures.push("OPENING_BANNER_TOP_PCT ما زال في MushafPageV2");
}
if (!/data-page-chrome="minimal"/.test(view)) {
  failures.push("MushafPageView بلا data-page-chrome=minimal");
}
if (!/MUSHAF_LAYOUT_BASELINE\.fontSizePx/.test(pageV2)) {
  failures.push("حجم الخط لا يُثبَّت من baseline.fontSizePx");
}
if (typeof baseline.fontSizePx !== "number") {
  failures.push("mushaf-baseline.json بلا fontSizePx");
}
if (!/overflow:\s*visible/.test(mushafCss.match(/\.mf2-lines\s*\{[^}]*\}/)?.[0] || "")) {
  failures.push(".mf2-lines بلا overflow:visible");
}

if (failures.length) {
  console.error("[mushaf-minimal-layout-gate] FAIL");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `[mushaf-minimal-layout-gate] OK — flow · S=${baseline.fontSizePx} · ornament=none · corner progress · board 1000×1618`,
);
