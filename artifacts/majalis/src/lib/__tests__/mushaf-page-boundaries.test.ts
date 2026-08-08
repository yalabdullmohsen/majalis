/**
 * يثبت أن حدود صفحات quran-v2 تطابق بيان mushaf=1 المعتمد.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-boundaries.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const quranV2 = resolve(appRoot, "public/data/quran-v2");
const pagesDir = resolve(quranV2, "pages");

const source = JSON.parse(readFileSync(resolve(quranV2, "SOURCE.json"), "utf8")) as {
  mushafId: number;
  forbiddenMushafIds: number[];
  fingerprint: { ayahCount: number; wordCount: number; codesSha: string; textsSha: string };
};
assert.equal(source.mushafId, 1, "SOURCE.json: mushafId يجب أن يكون 1");
assert.ok(source.forbiddenMushafIds.includes(2), "يُمنع mushaf=2 صراحة");

const boundaries = JSON.parse(
  readFileSync(resolve(quranV2, "page-boundaries.json"), "utf8"),
) as { mushafId: number; pages: Record<string, string[]> };
assert.equal(boundaries.mushafId, 1);
assert.equal(Object.keys(boundaries.pages).length, 604);

const fetchSrc = readFileSync(
  resolve(appRoot, "scripts/quran-import/fetch-mushaf-v2-data.mjs"),
  "utf8",
);
const syncSrc = readFileSync(
  resolve(appRoot, "scripts/quran-import/sync-mushaf-v2-line-layout.mjs"),
  "utf8",
);
const adoptSrc = readFileSync(
  resolve(appRoot, "scripts/quran-import/adopt-mushaf1-page-boundaries.mjs"),
  "utf8",
);
assert.match(fetchSrc, /MUSHAF_ID_QCF_V2\s*=\s*1/);
assert.match(fetchSrc, /مرفوض: يُمنع الجلب من mushaf≠1/);
assert.match(syncSrc, /MUSHAF_ID_QCF_V2\s*=\s*1/);
assert.match(adoptSrc, /MUSHAF_ID_QCF_V2\s*=\s*1/);
assert.doesNotMatch(fetchSrc, /mushaf=2&/);

const files = readdirSync(pagesDir).filter((f) => f.endsWith(".json"));
assert.equal(files.length, 604);

const codes: string[] = [];
const texts: string[] = [];
const seen = new Set<string>();
let words = 0;

for (let n = 1; n <= 604; n++) {
  const expected = boundaries.pages[String(n)];
  assert.ok(expected?.length, `حدود الصفحة ${n}`);
  const verses = JSON.parse(
    readFileSync(resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`), "utf8"),
  ) as Array<{ verse_key: string; page_number?: number; words?: Array<{ code_v2?: string; text_uthmani?: string; line_number?: number }> }>;
  const keys = verses.map((v) => v.verse_key);
  assert.deepEqual(keys, expected, `حدود الصفحة ${n} تطابق page-boundaries.json`);
  for (const v of verses) {
    assert.equal(v.page_number, n);
    assert.equal(seen.has(v.verse_key), false, `آية مكررة ${v.verse_key}`);
    seen.add(v.verse_key);
    for (const w of v.words ?? []) {
      words++;
      codes.push(w.code_v2 ?? "");
      texts.push(w.text_uthmani ?? "");
      assert.ok(typeof w.line_number === "number");
    }
  }
}

assert.equal(seen.size, 6236);
assert.equal(words, source.fingerprint.wordCount);
const codesSha = crypto.createHash("sha256").update(codes.join("")).digest("hex");
const textsSha = crypto.createHash("sha256").update(texts.join("")).digest("hex");
assert.equal(codesSha, source.fingerprint.codesSha, "بصمة code_v2 محفوظة");
assert.equal(textsSha, source.fingerprint.textsSha, "بصمة text_uthmani محفوظة");

console.log("mushaf-page-boundaries.test.ts: ok");
