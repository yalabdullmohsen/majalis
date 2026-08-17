/**
 * بوابة البسملة — مسار السطر نفسه بخط الصفحة، عشر سور + الفاتحة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-basmala-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pagesDir = resolve(root, "public/data/quran-v2/pages");
const chapters = JSON.parse(
  readFileSync(resolve(root, "public/data/quran-v2/chapters.json"), "utf8"),
) as Array<{
  id: number;
  name_arabic: string;
  bismillah_pre: boolean;
  pages: [number, number];
}>;
const pageSrc = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafPage.tsx"), "utf8");
const lineSrc = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafAyahLine.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const dataSrc = readFileSync(resolve(root, "src/lib/quran-data/qpc-page-data.ts"), "utf8");

assert.match(pageSrc, /needsVisualBasmala/);
assert.match(pageSrc, /bismillahPre === true/);
assert.match(pageSrc, /decorativeBasmalaWords/);
assert.match(pageSrc, /lineType/);
assert.doesNotMatch(pageSrc, /MushafBasmala/);
assert.match(lineSrc, /BASMALA_UTHMANI/);
assert.match(lineSrc, /بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ/);
assert.match(lineSrc, /data-line-type/);
assert.match(lineSrc, /basmallah/);
assert.match(css, /\[data-line-type="basmallah"\]/);
assert.match(css, /font-size:\s*var\(--mm-qpc-size\)/);
assert.doesNotMatch(css, /mm-basmala--uthmani/);
assert.doesNotMatch(css, /Amiri Quran[^;]*!important/);
assert.match(dataSrc, /basmalaSlot/);

const mushafDir = resolve(root, "src/features/mushaf-madinah");
const basmalaFiles = readdirSync(mushafDir).filter(
  (f) => /basmala/i.test(f) && /\.(tsx|ts|jsx|js)$/.test(f),
);
assert.deepEqual(basmalaFiles, [], `مكوّنات بسملة منفصلة: ${basmalaFiles.join(",")}`);
assert.equal(existsSync(resolve(mushafDir, "MushafBasmala.tsx")), false);

function chapter(id: number) {
  const c = chapters.find((x) => x.id === id);
  assert.ok(c, `سورة ${id}`);
  return c!;
}

const CASES = [
  { id: 1, page: 1, label: "الفاتحة", expectBismillahPre: false, note: "البسملة آية 1" },
  { id: 2, page: 2, label: "بداية البقرة", expectBismillahPre: true },
  { id: 9, page: 187, label: "بداية التوبة", expectBismillahPre: false },
  { id: 18, page: 293, label: "بداية الكهف", expectBismillahPre: true },
  { id: 19, page: 305, label: "بداية مريم", expectBismillahPre: true },
] as const;

for (const c of CASES) {
  const ch = chapter(c.id);
  assert.equal(ch.bismillah_pre, c.expectBismillahPre, `${c.label}: bismillah_pre`);
  assert.equal(ch.pages[0], c.page, `${c.label}: صفحة البداية`);
  const file = resolve(pagesDir, `page-${String(c.page).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `${c.label}: ملف الصفحة ${c.page}`);
}

/** عشر سور ذات بسملة افتتاحية: نفس مكوّن السطر ونفس حجم/عائلة الخط */
const TEN = [2, 3, 4, 5, 6, 7, 8, 10, 18, 19];
for (const id of TEN) {
  const ch = chapter(id);
  assert.equal(ch.bismillah_pre, true, `سورة ${id} لها بسملة افتتاحية`);
}
assert.match(lineSrc, /mm-ayah-line/);
assert.match(css, /\.mm-ayah-line\s*\{[^}]*--mm-qpc-family/);
assert.match(css, /\.mm-ayah-line\[data-line-type="basmallah"\][^}]*--mm-qpc-family/);
assert.match(css, /\.mm-ayah-line\[data-line-type="basmallah"\][^}]*--mm-qpc-size/);
assert.match(css, /\.mm-ayah-line\s*\{[^}]*--mm-qpc-size/);
assert.match(pageSrc, /centered/);

for (const n of [1, 2, 600, 602]) {
  const file = resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `صفحة تحقق ${n}`);
}

console.log("mushaf-basmala-gate.test.ts: ok");
