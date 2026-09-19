/**
 * TOTAL TRUST Phase 0 — تثبيت البرنامج + جرد آلي + قفل قرآن.
 * تشغيل: node --import tsx src/lib/__tests__/total-trust-phase0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");

function readRepo(rel: string) {
  return readFileSync(resolve(repoRoot, rel), "utf8");
}

assert.ok(existsSync(resolve(repoRoot, "docs/content-quality/TOTAL_TRUST_PROGRAM.md")));
assert.ok(existsSync(resolve(repoRoot, "docs/content-quality/TOTAL_TRUST_PHASE0.md")));
assert.ok(existsSync(resolve(repoRoot, "scripts/total-trust-inventory.mjs")));

const program = readRepo("docs/content-quality/TOTAL_TRUST_PROGRAM.md");
assert.match(program, /VERIFIED_EXACT/);
assert.match(program, /RELEASE_BLOCKER_CRITICAL/);
assert.match(program, /OWNER_DECISION/);
assert.match(program, /لا تعديل النسخة المقدمة/);

const phase0 = readRepo("docs/content-quality/TOTAL_TRUST_PHASE0.md");
assert.match(phase0, /cursor\/sunnah-total-trust-audit/);
assert.match(phase0, /47fc1cc7/);

const lock = spawnSync("node", ["scripts/verify-protected-quran-byte-lock.mjs"], {
  cwd: majalisRoot,
  encoding: "utf8",
});
assert.equal(lock.status, 0, lock.stderr || lock.stdout);
assert.match(lock.stdout, /Byte-for-Byte/);

const inv = spawnSync("node", ["scripts/total-trust-inventory.mjs"], {
  cwd: repoRoot,
  encoding: "utf8",
  env: { ...process.env, TOTAL_TRUST_SOURCE_COMMIT: "47fc1cc7ceb0e764c3a9b4805eeae27732c42e21" },
});
assert.equal(inv.status, 0, inv.stderr || inv.stdout);

const summary = JSON.parse(
  readFileSync(resolve(repoRoot, "reports/total-trust/inventory-summary.json"), "utf8"),
);
assert.equal(summary.program, "SUNNAH_TOTAL_TRUST");
assert.ok(summary.totals.appRoutePaths >= 300);
assert.ok(existsSync(resolve(repoRoot, "reports/total-trust/route-coverage-matrix.json")));
assert.ok(existsSync(resolve(repoRoot, "reports/total-trust/content-inventory.json")));

console.log("total-trust-phase0-gate.test.ts: ok");
