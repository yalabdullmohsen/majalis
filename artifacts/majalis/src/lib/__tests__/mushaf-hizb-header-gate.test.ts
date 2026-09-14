/**
 * بوابة: رأس الصفحة يعرض الجزء•الحزب من بيانات QPC المعتمدة، مع علامات خفيفة عند البداية.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-hizb-header-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/features/mushaf-reader/MushafPage.tsx");
const data = read("src/lib/quran-data/qpc-page-data.ts");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const font = read("src/features/mushaf-madinah/useQpcPageFont.ts");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const tele = read("src/features/mushaf-reader/mushaf-turn-telemetry.ts");

assert.match(data, /hizbNumber:\s*number/);
assert.match(data, /hizbStartingOnPage/);
assert.match(data, /rubElHizbStartingOnPage/);

assert.match(
  page,
  /الجزء \$\{toArabicDigits\(layout\.juzNumber\)\} • الحزب \$\{toArabicDigits\(layout\.hizbNumber\)\}/,
);
assert.match(page, /layout\.hizbStartingOnPage/);
assert.match(page, /layout\.rubElHizbStartingOnPage/);
assert.match(page, /nm-page__section-mark/);
assert.match(page, /rubQuarterLabel/);
assert.doesNotMatch(page, /Math\.ceil\(\s*layout\.pageNumber/);

assert.match(css, /\.nm-page__section-mark/);
assert.match(css, /pointer-events:\s*none/);

assert.match(font, /prefetchAdjacent/);
assert.match(font, /inflight/);
assert.match(reader, /prefetchAdjacent:\s*false/);
assert.match(reader, /mushafPerfInc\("readerMount"\)/);
assert.match(tele, /readerMountCount/);
assert.match(tele, /fontLoadCount/);

console.log("mushaf-hizb-header-gate.test.ts: ok");
