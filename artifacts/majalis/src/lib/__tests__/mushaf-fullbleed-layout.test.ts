/**
 * تخطيط المصحف بعرض كامل الشاشة بنمط «آية» —
 * خلفية ورقية، رأس/تذييل عائم، بلا وضع امتلاء منفصل.
 * تشغيل: npx tsx src/lib/__tests__/mushaf-fullbleed-layout.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const quranCss = readFileSync(resolve(appRoot, "src/styles/quran.css"), "utf8");
const viewSrc = readFileSync(resolve(appRoot, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
const immersiveSrc = readFileSync(resolve(appRoot, "src/lib/quran-immersive.ts"), "utf8");

const mpvBodyBlock = quranCss.match(/\.mpv-body--ayah\s*\{[^}]+\}/);
assert.ok(mpvBodyBlock, ".mpv-body--ayah معرّف في quran.css");
assert.equal(
  /max-width:\s*720px/.test(mpvBodyBlock[0]),
  false,
  ".mpv-body--ayah بلا max-width:720px الذي كان يحبس الصفحة",
);
assert.match(mpvBodyBlock[0], /max\(8px/);
assert.match(mpvBodyBlock[0], /box-sizing:\s*border-box/);
assert.match(mpvBodyBlock[0], /width:\s*100%/);
assert.equal(/83vh/.test(mpvBodyBlock[0]), false, ".mpv-body--ayah بلا سقف 83vh");

assert.match(quranCss, /\.quran-shell--chrome-hidden\s+\.mpv-body/);
assert.match(quranCss, /\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[\s\S]*?position:\s*absolute/);
assert.match(
  quranCss,
  /\.mpv-toolbar\.mpv-toolbar--ayah\.mpv-toolbar--hidden\s*\{[\s\S]*?display:\s*none/,
  "إخفاء الأدوات بلا حجز مساحة في التدفق",
);
assert.match(quranCss, /\.mpv-body\.mpv-body--ayah\s*\{[\s\S]*?padding-top:\s*6px/);
assert.match(viewSrc, /toArabicPageDigits/);
assert.match(viewSrc, /quran-shell--chrome-hidden/);
assert.match(viewSrc, /quran-shell--ayah/);
assert.match(viewSrc, /mpv-ayah-header/);
assert.match(viewSrc, /mpv-ayah-page-badge/);
assert.match(viewSrc, /AYAH_MUSHAF_PAPER_BG/);
assert.match(viewSrc, /سورة \{primarySurahMeta\.name\}/);
assert.match(viewSrc, /• الحزب/);
assert.match(viewSrc, /useState\(false\)/);
assert.match(viewSrc, /mpv-body--ayah/);
assert.equal(/mpv-ayah-nav-btn/.test(viewSrc), false, "بلا أسهم تنقّل في التذييل — الشارة فقط");
assert.equal(/pageFillMode/.test(viewSrc), false, "بلا وضع امتلاء منفصل");
assert.equal(/Maximize2|Minimize2|mpv-fill-enter/.test(viewSrc), false, "بلا أزرار تكبير/تصغير");

assert.match(immersiveSrc, /AYAH_MUSHAF_PAPER_BG\s*=\s*"#FAF7F2"/);

const bodyInner = quranCss.match(
  /\.quran-shell--ayah\s+\.qs-mushaf-body\s+\.qs-mushaf-body-inner\s*\{[^}]+\}/,
);
assert.ok(bodyInner, ".qs-mushaf-body-inner لمسار آية موجود");
assert.match(bodyInner[0], /height:\s*100%/);
assert.match(bodyInner[0], /aspect-ratio:\s*auto/);

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
assert.match(quranCss, /--color-mushaf-paper/);
assert.match(quranCss, /\.mpv-ayah-page-badge\s*\{/);
assert.match(quranCss, /mpv-ayah-page-badge__cartouche/);
assert.match(viewSrc, /mpv-ayah-page-badge__cartouche/);
assert.match(viewSrc, /MoreHorizontal/);
assert.match(viewSrc, /mpv-toolbar__more/);
assert.match(viewSrc, /aria-label="فهرس السور"/);
assert.match(viewSrc, /aria-label="التسميع"/);
assert.match(viewSrc, /aria-label="إعدادات القراءة"/);
assert.match(viewSrc, /aria-label="المزيد من الأدوات"/);
assert.match(quranCss, /\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[\s\S]*?max-width:\s*calc\(100%/);
assert.match(quranCss, /\.mpv-toolbar--ayah\s+\.mpv-toolbar__btn\s*\{[\s\S]*?white-space:\s*nowrap/);
assert.match(quranCss, /\.qs-mushaf-frame--ayah/);

const mushafV2 = readFileSync(resolve(appRoot, "src/styles/mushaf-v2.css"), "utf8");
const bismillah = mushafV2.match(/\.mf2-bismillah\s*\{[^}]+\}/);
assert.ok(bismillah, ".mf2-bismillah معرّف");
assert.match(bismillah[0], /white-space:\s*nowrap/);
assert.match(bismillah[0], /Amiri Quran/);
assert.match(bismillah[0], /optimizeLegibility/);

console.log("mushaf-fullbleed-layout.test.ts: ok");
