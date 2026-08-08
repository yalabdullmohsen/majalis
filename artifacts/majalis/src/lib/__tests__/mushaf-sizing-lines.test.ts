/**
 * يثبت فصل measurementExclusions عن sizingLines، وتصحيح spanRows.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-sizing-lines.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DRAWN_BASMALA_TEXT,
  DRAWN_LINE_MAX_OVERFLOW_PX,
  MEASUREMENT_EXCLUSION_REASONS,
  SIZING_LINE_KINDS,
  drawnSurahTitleText,
} from "../mushaf-sizing-lines";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

assert.deepEqual([...SIZING_LINE_KINDS].sort(), ["ayah", "basmala", "surah_title"].sort());
assert.ok(MEASUREMENT_EXCLUSION_REASONS.includes("last_line_of_surah"));
assert.ok(MEASUREMENT_EXCLUSION_REASONS.includes("surah_name|basmallah"));
assert.equal(DRAWN_LINE_MAX_OVERFLOW_PX, 0);
assert.ok(DRAWN_BASMALA_TEXT.includes("بِسْمِ"));
assert.equal(drawnSurahTitleText("الشمس"), "سُورَةُ الشمس");

const pageComp = readFileSync(resolve(appRoot, "src/components/quran/MushafPageV2.tsx"), "utf8");
assert.match(pageComp, /sizingEls/);
assert.match(pageComp, /surahTitleRefs/);
assert.match(pageComp, /basmalaRefs/);
assert.match(pageComp, /ayahLineRefs/);
assert.match(pageComp, /data-measurement-exclusions="metric-only"/);
assert.match(pageComp, /data-sizing-line="ayah"/);
assert.equal(
  /style=\{\{\s*flex:\s*spanRows/.test(pageComp),
  false,
  "رأس السورة لا يستخدم flex: spanRows",
);

const metric = readFileSync(
  resolve(appRoot, "scripts/quran-import/measure-mushaf-line-deviation.mjs"),
  "utf8",
);
assert.match(metric, /last_line_of_surah/);
assert.match(metric, /surah_name|basmallah/);

const dataSrc = readFileSync(resolve(appRoot, "src/lib/mushaf-v2-data.ts"), "utf8");
assert.match(dataSrc, /prevUsed/);
assert.match(dataSrc, /firstLine - prevUsed - 1/);

// صفحة 595: فجوات الرأس يجب أن تكون 2 و2 لا 3 و9
const verses = JSON.parse(
  readFileSync(resolve(appRoot, "public/data/quran-v2/pages/page-595.json"), "utf8"),
);
const lineWords = new Map<number, unknown[]>();
for (const v of verses) {
  for (const w of v.words ?? []) {
    if (!lineWords.has(w.line_number)) lineWords.set(w.line_number, []);
    lineWords.get(w.line_number)!.push(w);
  }
}
const usedLines = [...lineWords.keys()].sort((a, b) => a - b);
const starts = new Map<number, number>();
for (const v of verses) {
  const [s, a] = String(v.verse_key).split(":").map(Number);
  if (a === 1 && !starts.has(s)) {
    starts.set(s, Math.min(...v.words.map((w: { line_number: number }) => w.line_number)));
  }
}
const gaps: number[] = [];
for (const [, first] of [...starts.entries()].sort((a, b) => a[1] - b[1])) {
  const prevUsed = usedLines.filter((ln) => ln < first).pop() ?? 0;
  gaps.push(first - prevUsed - 1);
}
assert.deepEqual(gaps, [2, 2], `فجوات ص595 متوقعة [2,2] حصلت ${JSON.stringify(gaps)}`);

console.log("mushaf-sizing-lines.test.ts: ok");
