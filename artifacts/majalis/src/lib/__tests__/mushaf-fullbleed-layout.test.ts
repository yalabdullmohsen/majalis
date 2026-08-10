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
assert.match(mpvBodyBlock[0], /max\(2px,\s*var\(--inset-left\)\)/);
assert.match(mpvBodyBlock[0], /box-sizing:\s*border-box/);
assert.match(mpvBodyBlock[0], /width:\s*100%/);
assert.equal(/83vh/.test(mpvBodyBlock[0]), false, ".mpv-body--ayah بلا سقف 83vh");
assert.equal(/4\.5vw/.test(mpvBodyBlock[0]), false, "هوامش ضيّقة بلا 4.5vw");

assert.match(quranCss, /\.quran-shell--chrome-hidden\s+\.mpv-body/);
assert.match(quranCss, /\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[\s\S]*?position:\s*absolute/);
assert.match(
  quranCss,
  /\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[\s\S]*?bottom:\s*calc\(\s*var\(--inset-bottom/,
  "شريط آية أسفل الشاشة فوق inset-bottom",
);
assert.equal(
  /\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[^}]*top:\s*calc\(\s*var\(--inset-top\)/.test(quranCss),
  false,
  "شريط آية بلا top تحت الرأس (كان يتراكب مع الشارة)",
);
assert.match(
  quranCss,
  /\.mpv-toolbar\.mpv-toolbar--ayah\.mpv-toolbar--hidden\s*\{[\s\S]*?display:\s*none/,
  "إخفاء الأدوات بلا حجز مساحة في التدفق",
);
assert.match(
  quranCss,
  /\.quran-shell--chrome-hidden\s+\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[\s\S]*?display:\s*none/,
  "إخفاء شريط الأدوات مع chrome-hidden",
);
assert.match(quranCss, /\.mpv-ayah-header\s*\{[\s\S]*?position:\s*absolute/, "رأس عائم لا يزيح النص");
assert.match(quranCss, /\.mpv-ayah-footer\s*\{[\s\S]*?position:\s*absolute/, "ذيل عائم لا يزيح النص");
assert.match(quranCss, /\.mpv-body\.mpv-body--ayah\s*\{[\s\S]*?padding-top:\s*max\(8px/);
assert.equal(
  /\.mpv-body\.mpv-body--ayah\s*\{[\s\S]*?padding-top:\s*1\.35rem/.test(quranCss),
  false,
  "حشو علوي أدنى من 1.35rem",
);
assert.equal(
  /\.quran-shell--ayah\s*\{[^}]*position:\s*relative/.test(quranCss),
  false,
  ".quran-shell--ayah بلا position:relative يلغي immersive fixed",
);
assert.match(
  quranCss,
  /\.quran-shell--immersive\.quran-shell--ayah\s*\{[\s\S]*?position:\s*fixed/,
  "المصحف الغامر fixed يملأ الشاشة",
);
assert.match(viewSrc, /toArabicPageDigits/);
assert.match(viewSrc, /quran-shell--chrome-hidden/);
assert.match(viewSrc, /quran-shell--ayah/);
assert.match(viewSrc, /mpv-ayah-header/);
assert.match(viewSrc, /mpv-ayah-page-badge/);
assert.match(viewSrc, /AYAH_MUSHAF_PAPER_BG/);
assert.match(viewSrc, /mpv-ayah-header__surah">\{headerSurahNames\}/);
assert.match(viewSrc, /headerJuzLabel/);
assert.match(viewSrc, /الجزء \$\{toArabicDigits\(juz\)\}/, "الجزء فقط في الرأس");
assert.equal(/headerJuzHizb/.test(viewSrc), false, "بلا حزب في الرأس");
assert.match(viewSrc, /footerMetaLabel/);
assert.match(viewSrc, /formatRubElHizbFooterLabel/);
assert.match(viewSrc, /mpv-ayah-footer__meta/);
assert.match(viewSrc, /useState\(false\)/);
assert.match(viewSrc, /mpv-body--ayah/);
assert.equal(/mpv-ayah-nav-btn/.test(viewSrc), false, "بلا أسهم تنقّل في التذييل — الشارة فقط");
assert.equal(/pageFillMode/.test(viewSrc), false, "بلا وضع امتلاء منفصل");
assert.equal(/Maximize2|Minimize2|mpv-fill-enter/.test(viewSrc), false, "بلا أزرار تكبير/تصغير");
assert.match(viewSrc, /MushafPageCartoucheSvg/);
assert.match(quranCss, /\.mpv-ayah-page-badge\s*\{[\s\S]*?left:\s*50%/, "خرطوش وسط أسفل الصفحة");
assert.match(viewSrc, /data-cartouche-center="1"/, "علامة مركزية الخرطوش");
assert.match(quranCss, /\.mpv-ayah-header\s*\{[\s\S]*?font-size:\s*15px/, "رأس أوضح 15px");

assert.match(immersiveSrc, /AYAH_MUSHAF_PAPER_BG\s*=\s*"#FCF8F1"/);

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
const bismillah = mushafV2.match(/(?:^|\n)\.mf2-bismillah\s*\{[^}]+\}/);
assert.ok(bismillah, ".mf2-bismillah معرّف");
assert.match(bismillah[0], /white-space:\s*nowrap/);
assert.ok(
  bismillah[0].includes("Amiri Quran"),
  "البسملة الافتتاحية بخط رقعة/ثلث (Amiri) أخف من الآيات",
);
assert.equal(bismillah[0].includes("font-family: inherit"), false, "البسملة الافتتاحية لا ترث qpc-page");
assert.match(bismillah[0], /font-size:\s*1em/, "بسملة بمقاس سطر الآية");
assert.match(bismillah[0], /font-weight:\s*700/, "بسملة بسُمك يقارب سطر QPC");
assert.match(bismillah[0], /geometricPrecision|optimizeLegibility/);

console.log("mushaf-fullbleed-layout.test.ts: ok");
