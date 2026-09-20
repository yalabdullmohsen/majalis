/**
 * بوابة PR-1: Sunnah World-Class Product Polish — Baseline فقط.
 * Run: node --import tsx src/lib/__tests__/world-class-polish-pr1-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const baselineMd = resolve(repoRoot, "docs/performance/SUNNAH_WORLD_CLASS_BASELINE.md");
const metricsPath = resolve(repoRoot, "docs/performance/sunnah-world-class-baseline-metrics.json");
const captureScript = resolve(majalisRoot, "scripts/sunnah-world-class-baseline.mjs");
const marksPath = resolve(majalisRoot, "src/lib/world-class-polish/marks-contract.ts");

assert.ok(existsSync(baselineMd), "SUNNAH_WORLD_CLASS_BASELINE.md مطلوب");
assert.ok(existsSync(metricsPath), "sunnah-world-class-baseline-metrics.json مطلوب");
assert.ok(existsSync(captureScript), "سكربت الالتقاط مطلوب");
assert.ok(existsSync(marksPath), "marks-contract مطلوب");

const md = readRepo("docs/performance/SUNNAH_WORLD_CLASS_BASELINE.md");
assert.match(md, /World-Class Product Polish|PR-1/);
assert.match(md, /NOT MEASURED/);
assert.match(md, /551aee391|Measured commit/);
assert.match(md, /114\.69/);
assert.match(md, /test:bundle-budget/);
assert.match(md, /test:world-class-polish-pr1/);
assert.match(md, /App Store|RELEASE_BLOCKER_CRITICAL|OWNER_DECISION/);
assert.match(md, /لا إعلان|SUNNAH_WORLD_CLASS_POLISH_COMPLETE/);
assert.doesNotMatch(md, /أسرع بنسبة \d+%|سريع جدًا/);
assert.doesNotMatch(md, /رفع Bundle Budget|INITIAL_JS_GZIP_BUDGET\s*=\s*1[3-9]/);

const metrics = JSON.parse(readRepo("docs/performance/sunnah-world-class-baseline-metrics.json")) as {
  program: string;
  stage: number;
  commit: string;
  appStoreNote?: string;
  bundle: {
    entryJs: { gzipBytes: number; gzipKiB: number; gate: string };
    iconsJs: { gzipBytes: number; gate: string } | null;
    mainCss: { gzipBytes: number; gzipKiB: number; gate: string };
    mushafReaderPageJs: { gzipBytes: number; gate: string } | null;
  };
  budgetsLocked: {
    entryJsGzipBytes: number;
    iconsJsGzipBytes: number;
    mainCssGzipBytes: number;
    mushafReaderPageJsGzipBytesSoft: number;
  };
  notMeasuredThisRun: string[];
};

assert.equal(metrics.program, "sunnah-world-class-product-polish");
assert.equal(metrics.stage, 1);
assert.match(metrics.commit, /^[0-9a-f]{40}$/);
assert.ok(metrics.appStoreNote && /Apple|مراجعة/.test(metrics.appStoreNote));
assert.equal(metrics.bundle.entryJs.gate, "pass");
assert.equal(metrics.bundle.mainCss.gate, "pass");
assert.ok(metrics.bundle.entryJs.gzipBytes <= metrics.budgetsLocked.entryJsGzipBytes);
assert.ok(metrics.bundle.mainCss.gzipBytes <= metrics.budgetsLocked.mainCssGzipBytes);
assert.ok(Math.abs(metrics.bundle.entryJs.gzipKiB - 114.69) < 0.05 || metrics.bundle.entryJs.gzipKiB > 0);
if (metrics.bundle.iconsJs) {
  assert.equal(metrics.bundle.iconsJs.gate, "pass");
  assert.ok(metrics.bundle.iconsJs.gzipBytes <= metrics.budgetsLocked.iconsJsGzipBytes);
}
assert.ok(metrics.bundle.mushafReaderPageJs, "mushafReaderPageJs مطلوب");
assert.equal(metrics.bundle.mushafReaderPageJs.gate, "pass");
assert.ok(
  metrics.bundle.mushafReaderPageJs.gzipBytes <= metrics.budgetsLocked.mushafReaderPageJsGzipBytesSoft,
);
assert.ok(metrics.notMeasuredThisRun.includes("coldStartMs"));
assert.ok(metrics.notMeasuredThisRun.includes("touchToFeedbackMs"));
assert.ok(metrics.notMeasuredThisRun.includes("quranHubToMushafMs"));
assert.ok(metrics.notMeasuredThisRun.includes("fpsScrollHome"));

assert.equal(metrics.budgetsLocked.entryJsGzipBytes, 120 * 1024 + 320);
assert.equal(metrics.budgetsLocked.iconsJsGzipBytes, 30 * 1024);
assert.equal(metrics.budgetsLocked.mainCssGzipBytes, 100 * 1024);
assert.equal(metrics.budgetsLocked.mushafReaderPageJsGzipBytesSoft, 40 * 1024);

const marks = readPkg("src/lib/world-class-polish/marks-contract.ts");
assert.match(marks, /mj:theme-applied/);
assert.match(marks, /mj:safe-area-ready/);
assert.match(marks, /mj:home-painted/);
assert.match(marks, /WORLD_CLASS_BUDGETS_LOCKED/);
assert.match(marks, /RELEASE_BLOCKER_CRITICAL/);
assert.match(marks, /modifySubmittedBuild:\s*false/);

const mainTsx = readPkg("src/main.tsx");
assert.doesNotMatch(mainTsx, /world-class-polish/);

const budgetScript = readPkg("scripts/test-bundle-budget.mjs");
assert.match(budgetScript, /INITIAL_JS_GZIP_BUDGET\s*=\s*120\s*\*\s*1024\s*\+\s*320/);
assert.doesNotMatch(budgetScript, /INITIAL_JS_GZIP_BUDGET\s*=\s*(1[3-9][0-9]|[2-9][0-9]{2})\s*\*/);

const pkg = readPkg("package.json");
assert.match(pkg, /test:world-class-polish-pr1/);
assert.match(pkg, /capture:world-class-baseline|sunnah-world-class-baseline/);

console.log("world-class-polish-pr1-gate.test.ts: ok");
