/**
 * تخطيط المصحف بعرض كامل الشاشة بنمط «آية» —
 * خلفية ورقية، رأس/تذييل عائم، بلا بطاقات/إطار أصفر.
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
const immersiveSrc = readFileSync(resolve(appRoot, "src/lib/quran-immersive.ts"), "utf8");

const mpvBodyBlock = quranCss.match(/\.mpv-body--ayah\s*\{[^}]+\}/);
assert.ok(mpvBodyBlock, ".mpv-body--ayah معرّف في quran.css");
assert.equal(
  /max-width:\s*720px/.test(mpvBodyBlock[0]),
  false,
  ".mpv-body--ayah بلا max-width:720px الذي كان يحبس الصفحة",
);
assert.match(mpvBodyBlock[0], /max\(12px/);
assert.match(mpvBodyBlock[0], /100dvh\s*-\s*100px/);

assert.match(quranCss, /\.quran-shell--chrome-hidden\s+\.mpv-body/);
assert.match(viewSrc, /quran-shell--chrome-hidden/);
assert.match(viewSrc, /quran-shell--ayah/);
assert.match(viewSrc, /mpv-ayah-header/);
assert.match(viewSrc, /mpv-ayah-page-badge/);
assert.match(viewSrc, /AYAH_MUSHAF_PAPER_BG/);

assert.match(immersiveSrc, /AYAH_MUSHAF_PAPER_BG\s*=\s*"#FAF7F2"/);

const bodyInner = quranCss.match(/\.qs-mushaf-body\s+\.qs-mushaf-body-inner\s*\{[^}]+\}/);
assert.ok(bodyInner, ".qs-mushaf-body-inner موجود");
assert.match(bodyInner[0], /aspect-ratio:\s*0\.72/);
assert.match(bodyInner[0], /100cqh\s*\*\s*0\.72/);

assert.match(viewSrc, /mpv-ayah-header__juz/);
assert.match(viewSrc, /mpv-ayah-header__surah/);
assert.match(viewSrc, /primarySurahMeta\.name/);
assert.equal(
  /qs-mushaf-header-row__surah/.test(viewSrc),
  false,
  "أُزيل رأس الصفحة الصفراء داخل الإطار",
);
assert.equal(
  /qs-mushaf-corner/.test(viewSrc),
  false,
  "أُزيلت زخارف الزوايا من قارئ آية",
);

assert.match(quranCss, /\.quran-shell--ayah\s*\{/);
assert.match(quranCss, /#FAF7F2/);
assert.match(quranCss, /\.mpv-ayah-page-badge\s*\{/);
assert.match(quranCss, /border-radius:\s*999px/);
assert.match(quranCss, /\.qs-mushaf-frame--ayah/);

const mushafV2 = readFileSync(resolve(appRoot, "src/styles/mushaf-v2.css"), "utf8");
const bismillah = mushafV2.match(/\.mf2-bismillah\s*\{[^}]+\}/);
assert.ok(bismillah, ".mf2-bismillah معرّف");
assert.match(bismillah[0], /white-space:\s*nowrap/);
assert.match(bismillah[0], /Amiri Quran/);
assert.match(bismillah[0], /optimizeLegibility/);

console.log("mushaf-fullbleed-layout.test.ts: ok");
