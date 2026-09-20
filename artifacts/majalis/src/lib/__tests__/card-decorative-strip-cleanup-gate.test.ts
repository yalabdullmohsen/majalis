/**
 * بوابة: لا شريط جانبي زخرفي على بطاقات المحتوى (SVL PR-2).
 * node --import tsx src/lib/__tests__/card-decorative-strip-cleanup-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const cleanup = "src/styles/card-decorative-strip-cleanup.css";
const green = "src/styles/green-surface-system.css";
const unify = "src/styles/ssunnah-card-unify.css";
const calm = "src/styles/sections-calm-polish.css";
const main = "src/main.tsx";
const doc = "docs/design/SUNNAH_VISUAL_LANGUAGE.md";

for (const rel of [cleanup, green, unify, calm, main, doc]) {
  assert.ok(existsSync(resolve(root, rel)), `مفقود: ${rel}`);
}

const cleanCss = read(cleanup);
const greenCss = read(green);
const unifyCss = read(unify);
const calmCss = read(calm);
const mainSrc = read(main);
const docSrc = read(doc);

assert.match(mainSrc, /card-decorative-strip-cleanup\.css/);
assert.match(cleanCss, /border-inline-start-width:\s*1px\s*!important/);
assert.match(cleanCss, /\.hub-card/);
assert.match(cleanCss, /\.lesson-unified-card/);
assert.match(cleanCss, /kx-block--definition|blockquote|mushaf|status.strip/i);
assert.doesNotMatch(cleanCss, /border-inline-start:\s*[34]px/);

assert.doesNotMatch(greenCss, /border-inline-start:\s*[34]px/);
assert.doesNotMatch(unifyCss, /border-inline-start:\s*[34]px/);
assert.doesNotMatch(
  calmCss,
  /border-inline-start:\s*[34]px\s+solid\s+var\(--surface-feature-accent/,
);

assert.match(docSrc, /PR-2|شرائط/);

console.log("card-decorative-strip-cleanup-gate.test.ts: ok");
