/**
 * بوابة PR-1: Mushaf Internal Performance Baseline + Guards.
 * Run: node --import tsx src/lib/__tests__/mushaf-internal-perf-pr1-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const baselineMd = resolve(repoRoot, "docs/mushaf/MUSHAF_INTERNAL_PERFORMANCE_BASELINE.md");
const metricsPath = resolve(repoRoot, "docs/mushaf/baseline/internal-perf-pr1/metrics.json");
const chunksPath = resolve(repoRoot, "docs/mushaf/baseline/internal-perf-pr1/route-chunks.json");
const contractPath = resolve(
  majalisRoot,
  "src/features/mushaf-reader/mushaf-internal-perf-contract.ts",
);
const captureScript = resolve(majalisRoot, "scripts/mushaf-internal-perf-baseline.mjs");

assert.ok(existsSync(baselineMd));
assert.ok(existsSync(metricsPath));
assert.ok(existsSync(chunksPath));
assert.ok(existsSync(contractPath));
assert.ok(existsSync(captureScript));

const md = readRepo("docs/mushaf/MUSHAF_INTERNAL_PERFORMANCE_BASELINE.md");
assert.match(md, /PR-1/);
assert.match(md, /NOT MEASURED/);
assert.match(md, /MushafReaderPage/);
assert.match(md, /mushaf-turn-telemetry/);
assert.match(md, /test:mushaf-internal-perf-pr1/);
assert.doesNotMatch(md, /أسرع بنسبة \d+%/);
assert.doesNotMatch(md, /رفع Bundle Budget/);

const metrics = JSON.parse(readRepo("docs/mushaf/baseline/internal-perf-pr1/metrics.json")) as {
  stage: number;
  commit: string;
  bundle: {
    entryJs: { gzipBytes: number };
    mushafReaderPageJs: { gzipBytes: number };
  };
  budgetsLocked: {
    entryJsGzipBytes: number;
    mushafReaderPageJsGzipBytesSoft: number;
  };
  notMeasuredThisRun: string[];
  caches: { renderModelMaxEntries: number; layoutCacheMax: number };
};

assert.equal(metrics.stage, 1);
assert.match(metrics.commit, /^[0-9a-f]{40}$/);
assert.equal(metrics.budgetsLocked.entryJsGzipBytes, 120 * 1024 + 320);
assert.equal(metrics.budgetsLocked.mushafReaderPageJsGzipBytesSoft, 40 * 1024);
assert.ok(metrics.bundle.entryJs.gzipBytes <= metrics.budgetsLocked.entryJsGzipBytes);
assert.ok(
  metrics.bundle.mushafReaderPageJs.gzipBytes <=
    metrics.budgetsLocked.mushafReaderPageJsGzipBytesSoft,
);
assert.equal(metrics.caches.renderModelMaxEntries, 16);
assert.equal(metrics.caches.layoutCacheMax, 12);
assert.ok(metrics.notMeasuredThisRun.includes("touchToMoveMsDevice"));

const contract = readPkg("src/features/mushaf-reader/mushaf-internal-perf-contract.ts");
assert.match(contract, /touchStart/);
assert.match(contract, /activePageCommit/);
assert.match(contract, /MUSHAF_RENDER_CACHE_MAX_ENTRIES\s*=\s*16/);

const telemetry = readPkg("src/features/mushaf-reader/mushaf-turn-telemetry.ts");
assert.match(telemetry, /touchStart/);
assert.match(telemetry, /activePageCommit/);
assert.match(telemetry, /mushaf-turn-telemetry/);

const cache = readPkg("src/features/mushaf-reader/mushaf-page-render-cache.ts");
assert.match(cache, /MAX_ENTRIES\s*=\s*16/);
assert.match(cache, /getCachedPageRenderModel/);

const mainTsx = readPkg("src/main.tsx");
assert.doesNotMatch(mainTsx, /mushaf-internal-perf-contract/);

const budgetScript = readPkg("scripts/test-bundle-budget.mjs");
assert.match(budgetScript, /INITIAL_JS_GZIP_BUDGET\s*=\s*120\s*\*\s*1024\s*\+\s*320/);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:mushaf-internal-perf-pr1"/);
assert.match(pkg, /"test:mushaf-nextgen-baseline"/);

assert.ok(existsSync(resolve(repoRoot, "docs/mushaf/baseline/next-gen-pr1/summary.json")));
assert.ok(existsSync(resolve(repoRoot, "docs/mushaf/baseline/next-gen-pr1/render-cache-probe.json")));

console.log("mushaf-internal-perf-pr1-gate.test.ts: ok");
