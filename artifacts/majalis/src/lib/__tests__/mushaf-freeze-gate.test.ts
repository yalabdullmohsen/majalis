/**
 * بوابة تجميد المصحف: الوسم والـSHA والتجهيزة الذهبية موجودة قبل أي قياس حي.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-freeze-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const spec = readFileSync(resolve(root, "docs/MUSHAF_SPEC.md"), "utf8");
const freezeSrc = readFileSync(resolve(root, "scripts/mushaf-madinah/freeze-baseline.mjs"), "utf8");
const pkg = readFileSync(resolve(root, "package.json"), "utf8");
const goldenDir = resolve(root, "docs/mushaf-madinah/golden");
const metricsPath = resolve(goldenDir, "golden-metrics.json");

assert.match(spec, /الحالة المرجعية المعتمدة/);
assert.match(spec, /mushaf-good-20357d9ab/);
assert.match(spec, /20357d9ab2c01fff23fa44ed89e28c253c0773a4/);
assert.match(freezeSrc, /1,\s*2,\s*3,\s*5,\s*12,\s*50,\s*255,\s*400,\s*604/);
assert.match(freezeSrc, /320,\s*390,\s*430/);
assert.match(pkg, /freeze-baseline\.mjs/);

assert.ok(existsSync(metricsPath), "golden-metrics.json");
const metrics = JSON.parse(readFileSync(metricsPath, "utf8"));
assert.equal(metrics.refTag, "mushaf-good-20357d9ab");
assert.equal(metrics.refCommit, "20357d9ab2c01fff23fa44ed89e28c253c0773a4");
const pages = [1, 2, 3, 5, 12, 50, 255, 400, 604];
const widths = [320, 390, 430];
for (const n of pages) {
  for (const vw of widths) {
    const cell = metrics.cells[`${n}@${vw}`];
    assert.ok(cell, `خلية ${n}@${vw}`);
    assert.ok(cell.fontSize >= 12 && cell.fontSize <= 34, `fontSize ${n}@${vw}`);
    assert.ok(cell.widestLinePx > 0, `widestLine ${n}@${vw}`);
    assert.ok(cell.blockHeightPx > 0, `blockHeight ${n}@${vw}`);
    assert.ok(cell.lineCount >= 1, `lineCount ${n}@${vw}`);
    const png = resolve(goldenDir, `p${String(n).padStart(3, "0")}-w${vw}.png`);
    assert.ok(existsSync(png), png);
  }
}
assert.ok(existsSync(resolve(goldenDir, "golden-fingerprints.json")));

console.log("mushaf-freeze-gate.test.ts: ok cells=", pages.length * widths.length);
