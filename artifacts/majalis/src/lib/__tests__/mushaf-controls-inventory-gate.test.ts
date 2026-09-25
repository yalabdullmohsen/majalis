/**
 * بوابة جرد أزرار المصحف + عقود إصلاح الوضع/الأسهم/الفاصل.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-controls-inventory-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const inv = spawnSync(process.execPath, ["scripts/mushaf-controls-inventory.mjs"], {
  cwd: majalisRoot,
  encoding: "utf8",
});
assert.equal(inv.status, 0, inv.stderr || inv.stdout);

const reportRepo = resolve(majalisRoot, "../../docs/qa/MUSHAF_CONTROLS_INVENTORY.md");
const jsonRepo = resolve(majalisRoot, "../../docs/qa/mushaf-controls-inventory.json");
assert.ok(existsSync(reportRepo), "تقرير الجرد في docs/qa");
assert.ok(existsSync(jsonRepo), "JSON الجرد");

const summary = JSON.parse(readFileSync(jsonRepo, "utf8")) as {
  total: number;
  PASS: number;
  FIXED: number;
  BROKEN: number;
  NO_OP: number;
  contracts: Record<string, boolean>;
};

assert.ok(summary.total >= 25, `total=${summary.total}`);
assert.equal(summary.BROKEN, 0, "لا BROKEN متبقية");
assert.equal(summary.NO_OP, 0, "لا NO_OP متبقية");
assert.ok(summary.FIXED >= 5, `FIXED=${summary.FIXED}`);
assert.equal(summary.PASS + summary.FIXED, summary.total);

for (const [k, v] of Object.entries(summary.contracts)) {
  assert.equal(v, true, `contract ${k}`);
}

const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
assert.match(reader, /data-mushaf-appearance=\{mushafAppearanceResolved\}/);
assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
assert.match(css, /--mushaf-ayah-mark-number-size:\s*1\.52em/);
assert.match(css, /html\[data-mushaf-appearance="light"\] \.nm-root/);

console.log(
  `mushaf-controls-inventory-gate.test.ts: ok total=${summary.total} PASS=${summary.PASS} FIXED=${summary.FIXED}`,
);
