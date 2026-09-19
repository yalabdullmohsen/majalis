/**
 * TOTAL TRUST Phase 2+3 — حالات المسارات الحرجة + حدود المصحف (قراءة فقط).
 * تشغيل: node --import tsx src/lib/__tests__/total-trust-phase2-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return r;
}

assert.ok(existsSync(resolve(repoRoot, "scripts/total-trust-route-states.mjs")));
assert.ok(existsSync(resolve(repoRoot, "scripts/total-trust-mushaf-boundary.mjs")));

run("node", ["scripts/total-trust-route-states.mjs"], repoRoot);
run("node", ["scripts/total-trust-mushaf-boundary.mjs"], repoRoot);

const p2 = JSON.parse(readFileSync(resolve(repoRoot, "reports/total-trust/phase2-route-states.json"), "utf8"));
assert.equal(p2.phase, 2);
assert.ok(p2.offlineBannerGlobal);
assert.ok(p2.criticalRoutes >= 10);
assert.equal(p2.needsReview.length, 0, `needsReview=${p2.needsReview.join(",")}`);

const p3 = JSON.parse(readFileSync(resolve(repoRoot, "reports/total-trust/phase3-mushaf-boundary.json"), "utf8"));
assert.equal(p3.phase, 3);
assert.ok(p3.byteLockOk);
assert.equal(p3.issues.length, 0);
assert.ok(p3.pageReports.every((r: { ok: boolean }) => r.ok));

const docs = readFileSync(resolve(repoRoot, "docs/content-quality/TOTAL_TRUST_PHASE2.md"), "utf8");
assert.match(docs, /المرحلة 2/);
assert.match(docs, /المرحلة 3/);
assert.match(docs, /RELEASE_BLOCKER_CRITICAL/);

console.log("total-trust-phase2-gate.test.ts: ok");
