/**
 * بوابة سلامة نص المصحف على ٦٠٤ صفحة — عدد الآيات/الأسطر من البيانات.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-604-integrity-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pagesDir = resolve(root, "public/data/quran-v2/pages");
const css = readFileSync(resolve(root, "src/features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const pageComp = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafPage.tsx"), "utf8");
const fit = readFileSync(resolve(root, "src/features/mushaf-madinah/useMushafPageFontFit.ts"), "utf8");

type RawWord = {
  id: number;
  line_number: number;
  code_v2?: string;
  text_uthmani?: string;
  char_type_name?: string;
};
type RawVerse = {
  verse_key: string;
  page_number: number;
  words: RawWord[];
};

assert.match(css, /--mm-ref-text-start:\s*11\.9%/);
assert.match(css, /--mm-ref-text-end:\s*91\.1%/);
assert.match(fit, /fitPageFontSize/);
assert.match(pageComp, /decorativeBasmalaWords|lineType/);
assert.doesNotMatch(css, /\.mm-ayah-line\s*\{[^}]*overflow:\s*hidden/);
assert.doesNotMatch(css, /\.mm-basmala\s*\{[^}]*overflow:\s*hidden/);

let totalAyahs = 0;
let totalLines = 0;
let totalWords = 0;

for (let n = 1; n <= 604; n++) {
  const file = resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `ناقصة: صفحة ${n}`);
  const raw = JSON.parse(readFileSync(file, "utf8")) as RawVerse[];
  assert.ok(Array.isArray(raw) && raw.length > 0, `صفحة ${n}: بلا آيات`);

  const verseKeys = new Set<string>();
  const lineNums = new Set<number>();
  let wordCount = 0;

  for (const v of raw) {
    assert.ok(v.verse_key, `صفحة ${n}: آية بلا مفتاح`);
    assert.equal(v.page_number, n, `صفحة ${n}: page_number=${v.page_number}`);
    assert.ok(!verseKeys.has(v.verse_key), `صفحة ${n}: تكرار آية ${v.verse_key}`);
    verseKeys.add(v.verse_key);
    assert.ok(Array.isArray(v.words) && v.words.length > 0, `صفحة ${n}: ${v.verse_key} بلا كلمات`);
    for (const w of v.words) {
      assert.ok(w.line_number >= 1 && w.line_number <= 15, `صفحة ${n}: line ${w.line_number}`);
      assert.ok(typeof w.code_v2 === "string" && w.code_v2.length > 0, `صفحة ${n}: كلمة بلا glyph`);
      lineNums.add(w.line_number);
      wordCount += 1;
      totalWords += 1;
    }
  }

  assert.ok(wordCount > 0, `صفحة ${n}: صفر كلمات`);
  assert.ok(lineNums.size > 0, `صفحة ${n}: صفر أسطر`);
  assert.ok(lineNums.size <= 15, `صفحة ${n}: أسطر أكثر من ١٥`);

  totalAyahs += verseKeys.size;
  totalLines += lineNums.size;
}

assert.equal(totalAyahs, 6236, `إجمالي الآيات المتوقع ٦٢٣٦، وُجد ${totalAyahs}`);
assert.equal(totalWords, 83665, `إجمالي الكلمات المتوقع ٨٣٦٦٥، وُجد ${totalWords}`);
assert.ok(totalLines >= 6000, `إجمالي الأسطر منخفض: ${totalLines}`);

// صفحة ١: البسملة آية ١ كاملة
const p1 = JSON.parse(readFileSync(resolve(pagesDir, "page-001.json"), "utf8")) as RawVerse[];
assert.ok(p1.some((v) => v.verse_key === "1:1"), "الفاتحة آية ١ مفقودة من بيانات ص١");
assert.ok(p1.some((v) => v.verse_key === "1:7"), "الفاتحة آية ٧ مفقودة من بيانات ص١");

const p2 = JSON.parse(readFileSync(resolve(pagesDir, "page-002.json"), "utf8")) as RawVerse[];
assert.ok(p2.some((v) => v.verse_key === "2:5"), "البقرة آية ٥ مفقودة من بيانات ص٢");

console.log(
  `mushaf-604-integrity-gate.test.ts: ok pages=604 ayahs=${totalAyahs} lineSlots=${totalLines}`,
);
