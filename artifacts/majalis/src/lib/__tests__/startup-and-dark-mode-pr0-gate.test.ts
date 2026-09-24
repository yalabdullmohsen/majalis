/**
 * بوابة PR-0: جرد تعليق الإقلاع/FOUC + فجوات الوضع الليلي (بلا إصلاح منتج).
 * Run: node --import tsx src/lib/__tests__/startup-and-dark-mode-pr0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readMaj = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const reportPath = resolve(repoRoot, "docs/performance/STARTUP_AND_DARK_MODE_ROOT_CAUSE.md");
const metricsPath = resolve(repoRoot, "docs/performance/startup-and-dark-mode-pr0-metrics.json");
assert.ok(existsSync(reportPath));
assert.ok(existsSync(metricsPath));

const report = readRepo("docs/performance/STARTUP_AND_DARK_MODE_ROOT_CAUSE.md");
const metrics = JSON.parse(readRepo("docs/performance/startup-and-dark-mode-pr0-metrics.json")) as {
  stage: number;
  productPatchInThisPr: boolean;
  appUpdateManagerExists: boolean;
  semanticAppSurfaceTokensExist: boolean;
  confirmedClassifications: string[];
};

assert.equal(metrics.stage, 0);
assert.equal(metrics.productPatchInThisPr, false);
assert.equal(metrics.appUpdateManagerExists, false);
assert.equal(metrics.semanticAppSurfaceTokensExist, false);
assert.ok(metrics.confirmedClassifications.includes("CHUNK_LOAD_FAILURE"));
assert.ok(metrics.confirmedClassifications.includes("CRITICAL_CSS_NOT_READY"));
assert.ok(metrics.confirmedClassifications.includes("THEME_HYDRATION_LATE"));

assert.match(report, /لا إعلان `SUNNAH_STARTUP_AND_DARK_MODE_COMPLETE`/);
assert.match(report, /\*\*الحالة:\*\* PARTIAL/);
assert.match(report, /جاري تحسين العرض/);
assert.match(report, /ChunkRecoveryToast/);
assert.match(report, /ErrorBoundary/);
assert.match(report, /CRITICAL_CSS_NOT_READY/);
assert.match(report, /THEME_HYDRATION_LATE/);
assert.match(report, /Semantic Tokens|--app-surface/);
assert.match(report, /مركز القرآن/);

const recovery = readMaj("src/lib/chunk-recovery.ts");
const toast = readMaj("src/components/ChunkRecoveryToast.tsx");
const boundary = readMaj("src/components/ErrorBoundary.tsx");
const main = readMaj("src/main.tsx");
assert.match(recovery, /جاري تحسين العرض/);
assert.match(toast, /CHUNK_RECOVERING_EVENT/);
assert.match(boundary, /تحديث العرض/);
assert.match(main, /ChunkRecoveryToast/);

assert.equal(existsSync(resolve(majalisRoot, "src/lib/app-update-manager.ts")), false);

console.log("startup-and-dark-mode-pr0-gate.test.ts: ok");
