/**
 * بوابة تقارب كلمات المصحف — لا space-between افتراضي، أسطر قصيرة موسّطة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-word-spacing-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const line = read("src/features/mushaf-madinah/MushafAyahLine.tsx");
const fit = read("src/features/mushaf-madinah/useMushafPageFontFit.ts");
const bands = read("src/features/mushaf-madinah/layout-bands.ts");
const sheet = read("src/features/mushaf-madinah/AyahActionSheet.tsx");

const ayahBlock = css.match(/\.mm-ayah-line\s*\{[^}]+\}/)?.[0] ?? "";
assert.ok(ayahBlock, ".mm-ayah-line");
assert.match(ayahBlock, /justify-content:\s*center/, "افتراضي: توسيط لا تمديد");
assert.match(ayahBlock, /gap:\s*var\(--mushaf-word-spacing/, "فجوة ثابتة");
assert.doesNotMatch(ayahBlock, /justify-content:\s*space-between/, "لا space-between في الافتراضي");

assert.match(css, /--mushaf-word-spacing\s*:/);
assert.match(css, /--mushaf-line-height\s*:/);
assert.match(css, /--mushaf-page-padding\s*:/);
assert.match(css, /--mushaf-line-gap\s*:/);
assert.match(css, /\.mm-ayah-line\[data-fill="true"\][^}]*justify-content:\s*space-between/);
assert.match(css, /data-fill="false"[\s\S]{0,80}justify-content:\s*center/);

assert.match(line, /data-fill="false"/);
assert.match(bands, /MUSHAF_LINE_FILL_RATIO\s*=\s*0\.88/);
assert.match(fit, /MUSHAF_LINE_FILL_RATIO/);
assert.match(fit, /dataset\.fill\s*=\s*"false"/);

assert.match(sheet, /useState<SheetTab>\("tilawa"\)/);
assert.match(sheet, /ابدأ التلاوة/);
assert.match(sheet, /ayah-action-sheet__play-hero/);
assert.doesNotMatch(sheet, />\s*معاني\s*</);

console.log("mushaf-word-spacing-gate.test.ts: ok");
