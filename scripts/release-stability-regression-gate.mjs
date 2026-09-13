/**
 * بوابة استقرار تمنع تكرار أنماط أعطال سابقة (بدون تعطيل اختبارات).
 * تُشغَّل ضمن repo-gates / unit على فرع الإصدار.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ciYml = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const freeze = join(root, "docs/release/RELEASE_FREEZE.md");
const report = join(root, "reports/release-readiness-report.json");

assert.ok(existsSync(freeze), "RELEASE_FREEZE.md missing");
assert.ok(existsSync(report), "release-readiness-report.json missing");

// الرسمي يجب أن يبقى fail-fast: true — التشخيص فقط في workflow منفصل
assert.match(ciYml, /mushaf-measure:[\s\S]*?fail-fast:\s*true/, "ci.yml mushaf-measure must keep fail-fast: true");

const diag = readFileSync(join(root, ".github/workflows/full-regression-diagnostic.yml"), "utf8");
assert.match(diag, /fail-fast:\s*false/, "diagnostic workflow must collect all shard failures");
assert.match(diag, /workflow_dispatch/, "diagnostic must be manual-only");
assert.doesNotMatch(diag, /continue-on-error:\s*true/, "diagnostic must not hide failures");

const readiness = JSON.parse(readFileSync(report, "utf8"));
assert.equal(typeof readiness.verdict, "string");
assert.ok(["READY FOR APP STORE SUBMISSION", "READY WITH MANUAL APP STORE STEPS", "NOT READY", "NOT VERIFIED"].includes(readiness.verdict));

console.log("release-stability-regression-gate: ok");
