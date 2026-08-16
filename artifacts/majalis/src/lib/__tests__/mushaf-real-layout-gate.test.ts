/**
 * بوابة تخطيط المصحف الحقيقي /mushaf — VerifiedMushafReader.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-real-layout-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const page = read("src/features/mushaf-madinah/MushafPage.tsx");
const viewport = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
const pager = read("src/features/mushaf-madinah/MushafPager.tsx");
const actions = read("src/features/mushaf-madinah/AyahActionSheet.tsx");
const line = read("src/features/mushaf-madinah/MushafAyahLine.tsx");
const reader = read("src/pages/quran/MushafReaderPage.tsx");
const data = read("src/lib/quran-data/qpc-page-data.ts");

assert.match(reader, /VerifiedMushafReader|MushafViewport/);
assert.doesNotMatch(reader, /\.pdf/i);
assert.doesNotMatch(reader, /demo-ayah/);

// لا overflow أفقي متعمّد + لا تمرير رأسي يقص الصفحة
assert.match(css, /overflow-x:\s*(hidden|clip)/);
assert.match(css, /overflow-y:\s*hidden/);
assert.doesNotMatch(css, /\.mm-page-shell\s*\{[^}]*overflow-x:\s*scroll/);
assert.doesNotMatch(css, /aspect-ratio:\s*0\.68/);
assert.match(css, /100svh|100dvh/);
assert.match(css, /--mm-page-max-w:\s*min\(100%/);
assert.match(page, /useMushafPageFontFit/);
assert.match(viewport, /exitAlwaysVisible/);

// لا شريط أسود يغطي الآيات
assert.doesNotMatch(css, /\.mm-ayah-bar__panel\s*\{[^}]*background:\s*#000/);
assert.doesNotMatch(css, /\.mm-ayah-bar__dismiss\s*\{[^}]*background:\s*(rgba?\(0|#000)/);
assert.match(css, /\.mm-ayah-bar__dismiss\s*\{[^}]*background:\s*transparent/);

// مساحة محجوزة للأدوات
assert.match(css, /--mm-chrome-top-h/);
assert.match(css, /--mm-chrome-bottom-h/);
assert.match(css, /\.mm-page-shell[^{]*\{[^}]*padding-top:\s*var\(--mm-chrome-top-h\)/);
assert.match(css, /\.mm-page-shell[^{]*\{[^}]*padding-bottom:\s*var\(--mm-chrome-bottom-h\)/);

// البسملة موحدة المقاس مع سطر الآيات
assert.match(css, /\.mm-basmala\s*\{[^}]*font-size:\s*var\(--mm-qpc-size\)/);
assert.match(css, /\.mm-basmala\s*\{[^}]*text-align:\s*center/);
assert.match(page, /bismillahPre === true/);
assert.match(data, /bismillahPre/);
assert.match(data, /basmalaSlot/);

// التوبة بلا بسملة بصرية (bismillah_pre false في البيانات → needsVisualBasmala false)
assert.match(page, /needsVisualBasmala/);

// فواصل الآيات inline
assert.match(line, /mm-ayah-hit--end/);
assert.match(css, /\.mm-ayah-number/);

// Bottom sheet نصف الشاشة
assert.match(css, /max-height:\s*min\(50dvh/);
assert.match(actions, /mm-ayah-bar__handle/);

// السحب بالاتجاه الصحيح (RTL: dx سالب → التالية) + عتبة واضحة
assert.match(pager, /dx < 0\) go\(page \+ 1\)/);
assert.match(pager, /go\(page - 1\)/);
assert.match(pager, /SWIPE_MIN_PX\s*=\s*45/);
assert.match(viewport, /suppressPageSyncRef/);
assert.match(viewport, /اختر آية أولاً/);
assert.match(viewport, /listAyahAudioUrls/);
assert.match(viewport, /import\.meta\.env\.DEV/);

// فصل لمس الآية عن قلب الصفحة
assert.match(line, /stopPropagation/);
assert.match(line, /LONG_PRESS_MS/);
assert.match(line, /onPointerDown/);
assert.match(line, /data-testid="mushaf-ayah-hit"/);

assert.match(css, /فوق مناطق قلب الصفحة/);
assert.match(css, /data-ayah-bar="1"\]\s*\.mm-page-edge/);
assert.match(css, /scroll-margin-bottom/);
assert.match(css, /scrollbar-width:\s*none/);
assert.match(css, /\.mm-page-edge--next\s*\{[^}]*inset-inline-end:\s*0/);

assert.match(actions, /جاري تحميل التلاوة/);
assert.match(actions, /تعذر تحميل التلاوة/);
assert.match(actions, /mushaf-ayah-play/);
assert.match(actions, /handlePlayClick|onTogglePlay/);
assert.match(actions, /SkipBack|onPrevAyah/);
assert.match(actions, /آية \$\{parsed\.ayah\}/);

const dock = read("src/features/mushaf-madinah/MushafAudioDock.tsx");
for (const id of ["alafasy", "abdulsamad", "husary", "minshawi", "ghamdi", "maher"]) {
  assert.match(dock, new RegExp(`"${id}"`));
}
assert.match(read("src/features/mushaf-madinah/MushafSurahOrnament.tsx"), /mm-surah-ornament__motif/);
assert.match(viewport, /addEventListener\("scroll"/);

// ليلي بتباين واضح + highlight خفيف
assert.match(css, /html\[data-theme="dark"\]\s*\.mm-viewport/);
assert.match(css, /--mm-ink:\s*#f4efe5|--mm-ink:\s*#f7faf7|--mm-ink:\s*#ffffff/);
assert.match(css, /--mm-paper:\s*#fbf7ef/);
assert.match(css, /rgba\(191,\s*159,\s*91,\s*0\.(1[0-9]|22)\)/);

// بلا توسيط عمودي يترك فراغًا أبيض
assert.match(page, /targetStart = 1/);
assert.doesNotMatch(page, /\(15 - span\) \/ 2/);
assert.match(page, /النمل/);

console.log("mushaf-real-layout-gate.test.ts: ok");
