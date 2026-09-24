/**
 * بوابة PR-0: جرد شاشة «تحديث العرض» + مسار التعليق (بلا إصلاح منتج).
 * Run: node --import tsx src/lib/__tests__/update-display-hang-pr0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readMaj = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const reportPath = resolve(repoRoot, "docs/performance/UPDATE_DISPLAY_HANG_ROOT_CAUSE_PR0.md");
const metricsPath = resolve(repoRoot, "docs/performance/update-display-hang-pr0-metrics.json");
assert.ok(existsSync(reportPath), "تقرير PR-0 مطلوب");
assert.ok(existsSync(metricsPath), "metrics JSON مطلوب");

const report = readRepo("docs/performance/UPDATE_DISPLAY_HANG_ROOT_CAUSE_PR0.md");
const metrics = JSON.parse(readRepo("docs/performance/update-display-hang-pr0-metrics.json")) as {
  stage: number;
  localCodePathProven: boolean;
  appUpdateManagerExists: boolean;
};

assert.equal(metrics.stage, 0);
assert.equal(metrics.localCodePathProven, true);
assert.equal(metrics.appUpdateManagerExists, false);
assert.match(report, /السبب الجذري/);
assert.match(report, /ErrorBoundary/);
assert.match(report, /tryRecoverFromStaleChunk|chunk-recovery/);
assert.match(report, /ChunkRecoveryToast/);
assert.match(report, /NOT MEASURED/);
assert.match(report, /لا إعلان `SUNNAH_STARTUP_AND_UPDATE_PIPELINE_STABLE`/);
assert.match(report, /\*\*الحالة:\*\* PARTIAL/);

const boundary = readMaj("src/components/ErrorBoundary.tsx");
const recovery = readMaj("src/lib/chunk-recovery.ts");
const toast = readMaj("src/components/ChunkRecoveryToast.tsx");
const lazy = readMaj("src/lib/lazy-with-retry.ts");
const main = readMaj("src/main.tsx");

assert.match(boundary, /تحديث العرض/);
assert.match(boundary, /يُحدَّث العرض/);
assert.match(boundary, /recovering/);
assert.match(recovery, /جاري تحسين العرض/);
assert.match(recovery, /safeLocationReload\(\{\s*force:\s*true\s*\}\)/);
assert.match(toast, /CHUNK_RECOVERING_EVENT/);
assert.match(lazy, /tryRecoverFromStaleChunk/);
assert.match(lazy, /PAGE_LOAD_TIMEOUT_MS/);
assert.match(main, /ChunkRecoveryToast/);
assert.match(main, /ErrorBoundary/);

// لا AppUpdateManager بعد — يُثبت الجرد
assert.equal(existsSync(resolve(majalisRoot, "src/lib/app-update-manager.ts")), false);

console.log("update-display-hang-pr0-gate.test.ts: ok");
