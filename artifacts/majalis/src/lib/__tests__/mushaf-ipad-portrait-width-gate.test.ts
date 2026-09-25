/**
 * بوابة عرض المصحف على iPad — صفحة كبيرة بنسبة صحيحة بلا عمود هاتف 24px.
 * Run: node --import tsx src/lib/__tests__/mushaf-ipad-portrait-width-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveSignatureFontSizePx,
  resolveTabletPageMaxWidthPx,
  resolveTabletSignatureFontSizePx,
  SIGNATURE_FONT_SIZE_MAX_PX,
  SIGNATURE_WIDTH_CAPACITY_EM,
  TABLET_MUSHAF_FONT_SIZE_MAX_PX,
} from "@/features/mushaf-reader/sunnah-mushaf-signature-preset";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const madinah = read("src/features/mushaf-madinah/mushaf-madinah.css");
const readerCss = read("src/features/mushaf-reader/mushaf-reader.css");
const layout = read("src/features/mushaf-reader/useStableMushafLayout.ts");
const preset = read("src/features/mushaf-reader/sunnah-mushaf-signature-preset.ts");

/* 1) لا قفل عرض صريح 430px على غلاف الصفحة */
assert.doesNotMatch(
  madinah.replace(/\/\*[\s\S]*?\*\//g, ""),
  /\.mm-page-shell[^{]*\{[^}]*width:\s*min\(100%,\s*430px\)/,
  "mm-page-shell must not hard-lock width to 430px",
);
assert.doesNotMatch(
  madinah.replace(/\/\*[\s\S]*?\*\//g, ""),
  /\.mm-pager__sheet\s+\.mm-page-shell[^{]*\{[^}]*width:\s*min\(100%,\s*430px\)/,
  "pager sheet shell must not hard-lock width to 430px",
);
assert.match(madinah, /width:\s*min\(100%,\s*var\(--mm-page-max-w\)\)/);

/* 2) افتراضي هاتفي يبقى 430؛ اللوح يوسّع عبر breakpoint */
assert.match(madinah, /--mm-page-max-w:\s*min\(100%,\s*430px\)/);
assert.match(
  madinah,
  /@media\s*\(min-width:\s*768px\)\s*and\s*\(min-height:\s*600px\)[\s\S]{0,400}?--mm-page-max-w:\s*100%/,
);

/* 3) NewMushafReader: متغيرات اللوح + غلاف يتبع --nm-page-max-w */
assert.match(
  readerCss,
  /@media\s*\(min-width:\s*768px\)\s*and\s*\(min-height:\s*600px\)[\s\S]{0,400}?--nm-page-max-w:\s*100%/,
);
assert.match(readerCss, /width:\s*min\(100%,\s*var\(--nm-page-max-w\)\)/);
assert.match(
  readerCss,
  /@media\s*\(min-width:\s*768px\)\s*and\s*\(min-height:\s*600px\)[\s\S]{0,600}?\.nm-page--opening \.nm-page__body[\s\S]{0,120}?width:\s*100%/,
);

/* 4) JS: سقف متن هاتفي فقط؛ اللوح يحسب pageW من الحبر الآمن */
assert.match(layout, /PHONE_BODY_CAP_PX\s*=\s*30\s*\*\s*16/);
assert.match(layout, /TABLET_MIN_WIDTH_PX\s*=\s*768/);
assert.match(layout, /TABLET_MIN_HEIGHT_PX\s*=\s*600/);
assert.match(layout, /resolveBodyWidthPx|resolveBodyAndPageWidthPx/);
assert.match(layout, /resolveTabletPageMaxWidthPx/);
assert.match(layout, /resolveTabletSignatureFontSizePx/);
assert.doesNotMatch(
  layout,
  /Math\.min\(w\s*-\s*SIDE_PAD\s*\*\s*2,\s*30\s*\*\s*16\)/,
  "tablet must not inherit hard 480 body cap",
);
assert.match(preset, /TABLET_MUSHAF_FONT_SIZE_MAX_PX/);
assert.match(preset, /resolveTabletSignatureFontSizePx/);
assert.match(preset, /SIGNATURE_FONT_SIZE_MAX_PX\s*=\s*24/);

/* 5) Geometry: هاتف ≤24؛ لوح أكبر ويملأ عرض الحبر الآمن */
assert.equal(resolveSignatureFontSizePx(390, 700), 24);
assert.equal(resolveSignatureFontSizePx(480, 900), 24);
assert.equal(SIGNATURE_FONT_SIZE_MAX_PX, 24);
/* Signature phone path يبقى 24 حتى على عروض اللوح */
assert.equal(resolveSignatureFontSizePx(834, 1100), 24);

const ipadAirPortrait = resolveTabletSignatureFontSizePx(820, 1100);
const ipadProPortrait = resolveTabletSignatureFontSizePx(1000, 1300);
assert.ok(
  ipadAirPortrait > SIGNATURE_FONT_SIZE_MAX_PX,
  `iPad Air font ${ipadAirPortrait} must exceed phone cap`,
);
assert.ok(
  ipadProPortrait > SIGNATURE_FONT_SIZE_MAX_PX,
  `iPad Pro font ${ipadProPortrait} must exceed phone cap`,
);
assert.ok(ipadAirPortrait <= TABLET_MUSHAF_FONT_SIZE_MAX_PX);
assert.ok(ipadProPortrait <= TABLET_MUSHAF_FONT_SIZE_MAX_PX);

const pageAir = resolveTabletPageMaxWidthPx(820, ipadAirPortrait, 2);
const pagePro = resolveTabletPageMaxWidthPx(1024, ipadProPortrait, 2);
/* Landscape: الارتفاع يقيّد الخط (~byHeight) */
const landFont = resolveTabletSignatureFontSizePx(1176, 744);
const pageLand = resolveTabletPageMaxWidthPx(1180, landFont, 2);
assert.ok(pageAir > 480, `iPad Air page ${pageAir} must beat phone column`);
assert.ok(pagePro > 480, `iPad Pro page ${pagePro} must beat phone column`);
assert.ok(
  pageLand >= Math.round(SIGNATURE_FONT_SIZE_MAX_PX * SIGNATURE_WIDTH_CAPACITY_EM),
  `iPad landscape page ${pageLand} must be ≥ phone ink width`,
);
assert.ok(landFont >= SIGNATURE_FONT_SIZE_MAX_PX);
assert.ok(pageAir <= 820);
assert.ok(
  pageAir >= Math.ceil(ipadAirPortrait * SIGNATURE_WIDTH_CAPACITY_EM),
  "page shell must hug ink capacity",
);

/* Split View ضيق (<768): مسار هاتف */
assert.equal(resolveSignatureFontSizePx(500, 900), 24);

/* 6) ممنوع stretch / scale / letter-spacing على المتن */
assert.match(readerCss, /letter-spacing:\s*var\(--mushaf-letter-spacing,\s*0\)/);
assert.match(readerCss, /transform:\s*none/);
assert.doesNotMatch(layout, /letter-spacing["']:\s*["'][^0]/);
assert.match(layout, /--mushaf-letter-spacing",\s*"0"/);

console.log("mushaf-ipad-portrait-width-gate.test.ts: ok");
