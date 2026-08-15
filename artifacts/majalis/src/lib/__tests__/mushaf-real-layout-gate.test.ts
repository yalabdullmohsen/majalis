/**
 * بوابة تخطيط المصحف الحقيقي /mushaf — تمنع رجوع مشاكل التراكب والبسملة والشريط.
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
const viewport = read("src/features/mushaf-madinah/MushafViewport.tsx");
const actions = read("src/features/mushaf-madinah/MushafAyahActions.tsx");
const reader = read("src/pages/quran/MushafReaderPage.tsx");
const data = read("src/lib/quran-data/qpc-page-data.ts");

assert.match(reader, /MushafViewport/);
assert.doesNotMatch(reader, /\.pdf/i);
assert.doesNotMatch(reader, /demo-ayah/);

// لا overflow أفقي متعمّد
assert.match(css, /overflow-x:\s*hidden/);
assert.doesNotMatch(css, /\.mm-page-shell\s*\{[^}]*overflow-x:\s*scroll/);

// لا شريط أسود يغطي الآيات
assert.doesNotMatch(css, /\.mm-ayah-bar__panel\s*\{[^}]*background:\s*#000/);
assert.doesNotMatch(css, /\.mm-ayah-bar__dismiss\s*\{[^}]*background:\s*(rgba?\(0|#000)/);
assert.match(css, /\.mm-ayah-bar__dismiss\s*\{[^}]*background:\s*transparent/);

// مساحة محجوزة للأدوات
assert.match(css, /--mm-chrome-top-h/);
assert.match(css, /--mm-chrome-bottom-h/);
assert.match(css, /\.mm-page-shell\s*\{[^}]*padding-top:\s*var\(--mm-chrome-top-h\)/);
assert.match(css, /\.mm-page-shell\s*\{[^}]*padding-bottom:\s*var\(--mm-chrome-bottom-h\)/);

// البسملة موحدة المقاس مع سطر الآيات
assert.match(css, /\.mm-basmala\s*\{[^}]*font-size:\s*var\(--mm-qpc-size\)/);
assert.match(css, /\.mm-basmala\s*\{[^}]*text-align:\s*center/);
assert.match(page, /bismillahPre === true/);
assert.match(data, /bismillahPre/);
assert.match(data, /basmalaSlot/);

// التوبة بلا بسملة بصرية (bismillah_pre false في البيانات → needsVisualBasmala false)
assert.match(page, /needsVisualBasmala/);

// فواصل الآيات inline
assert.match(read("src/features/mushaf-madinah/MushafAyahLine.tsx"), /mm-ayah-hit--end/);
assert.match(css, /\.mm-ayah-number/);

// Bottom sheet نصف الشاشة
assert.match(css, /max-height:\s*min\(50dvh/);
assert.match(actions, /mm-ayah-bar__handle/);

// السحب بالاتجاه الصحيح (RTL: dx سالب → التالية)
assert.match(viewport, /dx < 0\) go\(page \+ 1\)/);
assert.match(viewport, /go\(page - 1\)/);

// ليلي بتباين واضح
assert.match(css, /html\[data-theme="dark"\]\s*\.mm-viewport/);
assert.match(css, /--mm-ink:\s*#f7faf7|--mm-ink:\s*#ffffff/);

// بلا توسيط عمودي يترك فراغًا أبيض
assert.match(page, /targetStart = 1/);
assert.doesNotMatch(page, /\(15 - span\) \/ 2/);

console.log("mushaf-real-layout-gate.test.ts: ok");
