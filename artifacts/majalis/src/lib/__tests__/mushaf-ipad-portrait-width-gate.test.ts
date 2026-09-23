/**
 * بوابة عرض المصحف على iPad Portrait — لا عمود هاتف 430px في المنتصف.
 * Run: node --import tsx src/lib/__tests__/mushaf-ipad-portrait-width-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSignatureFontSizePx } from "@/features/mushaf-reader/sunnah-mushaf-signature-preset";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const madinah = read("src/features/mushaf-madinah/mushaf-madinah.css");
const readerCss = read("src/features/mushaf-reader/mushaf-reader.css");
const layout = read("src/features/mushaf-reader/useStableMushafLayout.ts");

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

/* 4) JS: سقف متن هاتفي فقط؛ اللوح يستخدم العرض المتاح */
assert.match(layout, /PHONE_BODY_CAP_PX\s*=\s*30\s*\*\s*16/);
assert.match(layout, /TABLET_MIN_WIDTH_PX\s*=\s*768/);
assert.match(layout, /TABLET_MIN_HEIGHT_PX\s*=\s*600/);
assert.match(layout, /resolveBodyWidthPx/);
assert.doesNotMatch(
  layout,
  /Math\.min\(w\s*-\s*SIDE_PAD\s*\*\s*2,\s*30\s*\*\s*16\)/,
  "tablet must not inherit hard 480 body cap",
);

/* 5) Geometry: حجم الخط يبقى ≤24 على عروض اللوح */
assert.equal(resolveSignatureFontSizePx(390, 700), 24);
assert.equal(resolveSignatureFontSizePx(480, 900), 24);
assert.equal(resolveSignatureFontSizePx(834, 1100), 24);
assert.equal(resolveSignatureFontSizePx(1024, 1366), 24);

/* 6) ممنوع stretch / scale / letter-spacing على المتن */
assert.match(readerCss, /letter-spacing:\s*var\(--mushaf-letter-spacing,\s*0\)/);
assert.match(readerCss, /transform:\s*none/);
assert.doesNotMatch(layout, /letter-spacing["']:\s*["'][^0]/);
assert.match(layout, /--mushaf-letter-spacing",\s*"0"/);

console.log("mushaf-ipad-portrait-width-gate.test.ts: ok");
