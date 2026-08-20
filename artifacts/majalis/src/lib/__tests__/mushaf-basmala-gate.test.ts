/**
 * بوابة البسملة — صفحات الفاتحة/البقرة/التوبة/الكهف/مريم + QPC V2.
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
const basmalaSrc = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafBasmala.tsx"), "utf8");
const dataSrc = readFileSync(resolve(root, "src/lib/quran-data/qpc-page-data.ts"), "utf8");
const css = readFileSync(resolve(root, "src/features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const qpcWords = readFileSync(resolve(root, "src/lib/quran-data/basmala-qpc-words.ts"), "utf8");

assert.match(pageSrc, /needsVisualBasmala/);
assert.match(pageSrc, /bismillahPre === true/);
assert.match(pageSrc, /MushafBasmala/);
assert.doesNotMatch(pageSrc, /inlineBasmala/);
assert.doesNotMatch(pageSrc, /with-basmala/);
assert.match(basmalaSrc, /BASMALA_QPC_WORDS/);
assert.match(basmalaSrc, /data-basmala="qpc"/);
assert.doesNotMatch(basmalaSrc, /BASMALA_UTHMANI/);
assert.doesNotMatch(basmalaSrc, /uthmani/);
assert.match(qpcWords, /glyphText/);
assert.match(dataSrc, /basmalaSlot/);
assert.match(dataSrc, /chapter\.bismillahPre \? bannerSlot \+ 1/);
assert.match(css, /\.mm-basmala\s*\{[^}]*font-size:\s*var\(--mm-qpc-size\)/);
assert.match(css, /\.mm-basmala\s*\{[^}]*font-weight:\s*400/);
assert.doesNotMatch(css, /\.mm-basmala--uthmani/);

const mushafDir = resolve(root, "src/features/mushaf-madinah");
const basmalaFiles = readdirSync(mushafDir).filter(
  (f) => /basmala/i.test(f) && /\.(tsx|ts|jsx|js)$/.test(f),
);
assert.deepEqual(basmalaFiles, ["MushafBasmala.tsx"], `مكوّنات بسملة: ${basmalaFiles.join(",")}`);

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

/* ١١٣ سورة لها بسملة بصرية (كل السور عدا التوبة) — الفاتحة آية مرقّمة */
const withPre = chapters.filter((c) => c.bismillah_pre === true);
const withoutPre = chapters.filter((c) => c.bismillah_pre === false);
assert.equal(withPre.length, 112, `bismillah_pre=true يجب ١١٢ (الفعلي ${withPre.length})`);
assert.equal(withoutPre.length, 2, "الفاتحة + التوبة فقط بلا bismillah_pre");
assert.deepEqual(
  withoutPre.map((c) => c.id).sort((a, b) => a - b),
  [1, 9],
  "المستثنيان: ١ و٩",
);
const naml = chapter(27);
assert.equal(naml.bismillah_pre, true, "النمل: بسملة مطلعية + ٢٧:٣٠ داخل النص");
assert.match(pageSrc, /النمل|27/, "تعليق النمل في MushafPage");

for (const n of [1, 2, 440, 453, 600, 602]) {
  assert.ok(existsSync(resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`)), `صفحة ${n}`);
}

console.log("mushaf-basmala-gate.test.ts: ok");
