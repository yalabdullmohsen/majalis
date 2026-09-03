/**
 * جرد مسارات الأحكام + قواعد Publication Gate على كل السجلات.
 * node --import tsx src/lib/__tests__/rulings-route-inventory.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const script = resolve(root, "scripts/audit-rulings-route-inventory.mjs");

const run = spawnSync(process.execPath, [script], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env },
});
assert.equal(run.status, 0, run.stderr || run.stdout || "inventory failed");

const reportPath = resolve(root, "../../reports/rulings-route-inventory.json");
assert.ok(existsSync(reportPath), "تقرير الجرد موجود");
const report = JSON.parse(readFileSync(reportPath, "utf8"));

assert.ok(report.summary.total >= 147, "جرد الأحكام لا ينكمش دون قصد");
assert.equal(report.summary.publicEligible, 0);
assert.equal(report.summary.pending_review, report.summary.total, "كل السجلات ما زالت pending_review");
assert.equal(report.summary.inSitemap, 0);
assert.equal(report.summary.inSearch, 0);
assert.equal(report.summary.inPrerender, 0);
assert.equal(report.failures.length, 0);

for (const row of report.inventory) {
  assert.ok(row.identifier, "identifier");
  assert.ok(row.slug, "slug");
  assert.ok(row.reviewStatus, "reviewStatus");
  assert.ok(row.publicationStatus, "publicationStatus");
  assert.equal(row.publicEligible, false);
  assert.equal(row.sitemapMembership, false);
  assert.equal(row.searchIndexMembership, false);
  assert.equal(row.indexability, "noindex");
}

console.log("rulings-route-inventory.test.ts: ok", report.summary);
