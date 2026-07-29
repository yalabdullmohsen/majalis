/**
 * تخطيط المصحف بعرض كامل الشاشة — يمنع عودة max-width/حشو يضيّق الصفحة.
 * تشغيل: npx tsx src/lib/__tests__/mushaf-fullbleed-layout.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const quranCss = readFileSync(resolve(appRoot, "src/styles/quran.css"), "utf8");
const viewSrc = readFileSync(resolve(appRoot, "src/views/MushafPageView.tsx"), "utf8");

const mpvBodyBlock = quranCss.match(/\.mpv-body\s*\{[^}]+\}/);
assert.ok(mpvBodyBlock, ".mpv-body معرّف في quran.css");
assert.equal(
  /max-width:\s*720px/.test(mpvBodyBlock[0]),
  false,
  ".mpv-body بلا max-width:720px الذي كان يحبس الصفحة",
);
assert.match(mpvBodyBlock[0], /max-width:\s*none/);
assert.match(mpvBodyBlock[0], /6px/);

assert.match(quranCss, /\.quran-shell--chrome-hidden\s+\.mpv-body/);
assert.match(viewSrc, /quran-shell--chrome-hidden/);

const bodyInner = quranCss.match(/\.qs-mushaf-body\s+\.qs-mushaf-body-inner\s*\{[^}]+\}/);
assert.ok(bodyInner, ".qs-mushaf-body-inner موجود");
assert.match(bodyInner[0], /aspect-ratio:\s*0\.72/);
assert.match(bodyInner[0], /100cqh\s*\*\s*0\.72/);

assert.match(viewSrc, /qs-mushaf-header-row__surah/);
assert.match(viewSrc, /qs-mushaf-header-row__meta/);
assert.match(viewSrc, /qs-mushaf-header-row__page/);
assert.match(viewSrc, /سورة \{primarySurahMeta\.name\}/);

const headerRow = quranCss.match(/\.qs-mushaf-header-row\s*\{[^}]+\}/);
assert.ok(headerRow, ".qs-mushaf-header-row معرّف");
assert.match(headerRow[0], /grid-template-columns/);

const mushafV2 = readFileSync(resolve(appRoot, "src/styles/mushaf-v2.css"), "utf8");
const bismillah = mushafV2.match(/\.mf2-bismillah\s*\{[^}]+\}/);
assert.ok(bismillah, ".mf2-bismillah معرّف");
assert.match(bismillah[0], /white-space:\s*nowrap/);
assert.match(bismillah[0], /Amiri Quran/);
assert.match(bismillah[0], /optimizeLegibility/);

console.log("mushaf-fullbleed-layout.test.ts: ok");
