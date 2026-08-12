/**
 * يثبت ثوابت تخطيط أسطر المصحف (QCF V2 / mushaf=1):
 * - كل كلمة لها line_number في 1–15
 * - لا سطر مُسجَّل بلا كلمات في التجميع (ضمني)
 * - عدد الكلمات الكلي ثابت
 * - الصفحات العادية تصل للسطر 15 (مع استثناءات معروفة)
 *
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-line-layout-invariants.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const pagesDir = resolve(appRoot, "public/data/quran-v2/pages");

/** إجمالي كلمات quran-v2 — أي تغيّر تجزئة يكسر هذا الرقم */
const EXPECTED_TOTAL_WORDS = 83_665;

/**
 * صفحات ينتهي محتواها قبل السطر 15 في مصحف المدينة (mushaf=1)،
 * إضافةً للفاتحة وأول البقرة.
 */
const KNOWN_MAX_LINE_LT_15 = new Set([
  1, 2, 76, 207, 331, 341, 349, 366, 376, 414, 417, 445, 452, 498, 506, 525, 548, 555, 557, 584,
]);

const files = readdirSync(pagesDir).filter((f) => f.endsWith(".json"));
assert.equal(files.length, 604, "يجب وجود 604 ملف صفحة");

let totalWords = 0;

for (const file of files) {
  const pageNum = Number(file.match(/page-(\d+)\.json/)?.[1]);
  assert.ok(pageNum >= 1 && pageNum <= 604, `اسم ملف غير صالح: ${file}`);

  const verses = JSON.parse(readFileSync(resolve(pagesDir, file), "utf8")) as Array<{
    verse_key: string;
    page_number?: number;
    words?: Array<{ line_number?: number | null; position?: number; code_v2?: string }>;
  }>;
  assert.ok(Array.isArray(verses) && verses.length > 0, `صفحة ${pageNum} بلا آيات`);

  const lines = new Set<number>();
  for (const v of verses) {
    assert.equal(v.page_number, pageNum, `page_number لـ ${v.verse_key}`);
    let expectedPos = 1;
    for (const w of v.words ?? []) {
      totalWords++;
      assert.ok(w.code_v2, `code_v2 مفقود في ${v.verse_key} pos=${w.position}`);
      assert.equal(
        typeof w.line_number,
        "number",
        `كلمة بلا سطر في ${v.verse_key} pos=${w.position}`,
      );
      const ln = w.line_number as number;
      assert.ok(Number.isInteger(ln) && ln >= 1 && ln <= 15, `سطر خارج 1–15: ${ln} @ ${v.verse_key}`);
      lines.add(ln);
      assert.equal(w.position, expectedPos, `position غير متسلسل في ${v.verse_key}`);
      expectedPos++;
    }
  }

  assert.ok(lines.size > 0, `صفحة ${pageNum}: لا أسطر`);
  const maxLn = Math.max(...lines);
  if (pageNum >= 3 && maxLn !== 15 && !KNOWN_MAX_LINE_LT_15.has(pageNum)) {
    assert.fail(`صفحة ${pageNum}: أقصى سطر=${maxLn} متوقع 15`);
  }
}

assert.equal(totalWords, EXPECTED_TOTAL_WORDS, "عدد الكلمات الكلي يجب أن يبقى ثابتًا");

// مصدر التخطيط الموثّق = mushaf=1
const syncSrc = readFileSync(
  resolve(appRoot, "scripts/quran-import/sync-mushaf-v2-line-layout.mjs"),
  "utf8",
);
const fetchSrc = readFileSync(
  resolve(appRoot, "scripts/quran-import/fetch-mushaf-v2-data.mjs"),
  "utf8",
);
assert.match(syncSrc, /MUSHAF_ID_QCF_V2\s*=\s*1/);
assert.match(fetchSrc, /MUSHAF_ID_QCF_V2\s*=\s*1/);
assert.match(fetchSrc, /mushaf=\$\{MUSHAF_ID_QCF_V2\}/);
assert.doesNotMatch(fetchSrc, /mushaf=2&/);

console.log("mushaf-line-layout-invariants.test.ts: ok");
