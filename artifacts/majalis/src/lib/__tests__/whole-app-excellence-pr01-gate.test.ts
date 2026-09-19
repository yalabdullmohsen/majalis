/**
 * بوابة WAVE 1 / PR-01: Whole-App Excellence — Baseline + Protection Gates.
 * Run: node --import tsx src/lib/__tests__/whole-app-excellence-pr01-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const baselineMd = resolve(repoRoot, "docs/performance/WHOLE_APP_BASELINE.md");
const metricsPath = resolve(repoRoot, "docs/performance/whole-app-baseline-metrics.json");
const captureScript = resolve(majalisRoot, "scripts/whole-app-baseline.mjs");
const marksPath = resolve(majalisRoot, "src/lib/whole-app-excellence/marks-contract.ts");

assert.ok(existsSync(baselineMd), "WHOLE_APP_BASELINE.md مطلوب");
assert.ok(existsSync(metricsPath), "whole-app-baseline-metrics.json مطلوب");
assert.ok(existsSync(captureScript), "سكربت الالتقاط مطلوب");
assert.ok(existsSync(marksPath), "marks-contract مطلوب");

const md = readRepo("docs/performance/WHOLE_APP_BASELINE.md");
assert.match(md, /PR-01|WAVE 1/);
assert.match(md, /NOT MEASURED/);
assert.match(md, /6c197f577|Measured commit/);
assert.match(md, /test:bundle-budget/);
assert.match(md, /test:whole-app-excellence-pr01/);
assert.match(md, /114\.34|114\.3/);
assert.doesNotMatch(md, /أسرع بنسبة \d+%|سريع جدًا/);
assert.doesNotMatch(md, /رفع Bundle Budget|INITIAL_JS_GZIP_BUDGET\s*=\s*1[3-9]/);

const metrics = JSON.parse(readRepo("docs/performance/whole-app-baseline-metrics.json")) as {
  program: string;
  stage: number;
  commit: string;
  bundle: {
    entryJs: { gzipBytes: number; gate: string };
    iconsJs: { gzipBytes: number; gate: string } | null;
    mainCss: { gzipBytes: number; gate: string };
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

assert.equal(metrics.program, "sunnah-whole-app-excellence");
assert.equal(metrics.stage, 1);
assert.match(metrics.commit, /^[0-9a-f]{40}$/);
assert.equal(metrics.bundle.entryJs.gate, "pass");
assert.equal(metrics.bundle.mainCss.gate, "pass");
assert.ok(metrics.bundle.entryJs.gzipBytes <= metrics.budgetsLocked.entryJsGzipBytes);
assert.ok(metrics.bundle.mainCss.gzipBytes <= metrics.budgetsLocked.mainCssGzipBytes);
if (metrics.bundle.iconsJs) {
  assert.equal(metrics.bundle.iconsJs.gate, "pass");
  assert.ok(metrics.bundle.iconsJs.gzipBytes <= metrics.budgetsLocked.iconsJsGzipBytes);
}
assert.ok(metrics.bundle.mushafReaderPageJs, "mushafReaderPageJs مطلوب في القياس");
assert.equal(metrics.bundle.mushafReaderPageJs.gate, "pass");
assert.ok(
  metrics.bundle.mushafReaderPageJs.gzipBytes <= metrics.budgetsLocked.mushafReaderPageJsGzipBytesSoft,
);
assert.ok(metrics.notMeasuredThisRun.includes("coldStartMs"));
assert.ok(metrics.notMeasuredThisRun.includes("clickToShellMs"));
assert.ok(metrics.notMeasuredThisRun.includes("mushafOpenMs"));

assert.equal(metrics.budgetsLocked.entryJsGzipBytes, 120 * 1024 + 320);
assert.equal(metrics.budgetsLocked.iconsJsGzipBytes, 30 * 1024);
assert.equal(metrics.budgetsLocked.mainCssGzipBytes, 100 * 1024);
assert.equal(metrics.budgetsLocked.mushafReaderPageJsGzipBytesSoft, 40 * 1024);

const marks = readPkg("src/lib/whole-app-excellence/marks-contract.ts");
assert.match(marks, /mj:theme-applied/);
assert.match(marks, /mj:safe-area-ready/);
assert.match(marks, /mj:home-painted/);
assert.match(marks, /WHOLE_APP_BUDGETS_LOCKED/);

const theme = readPkg("src/lib/theme-preference.ts");
const shell = readPkg("src/lib/app-shell-stability.ts");
const home = readPkg("src/pages/account/ui/HomeView.tsx");
const app = readPkg("src/App.tsx");
assert.match(theme, /mj:theme-applied/);
assert.match(shell, /mj:safe-area-ready/);
assert.match(home, /mj:home-painted/);
assert.match(app, /route-nav:/);

const mainTsx = readPkg("src/main.tsx");
assert.doesNotMatch(mainTsx, /whole-app-excellence/);

const budgetScript = readPkg("scripts/test-bundle-budget.mjs");
assert.match(budgetScript, /INITIAL_JS_GZIP_BUDGET\s*=\s*120\s*\*\s*1024\s*\+\s*320/);
assert.doesNotMatch(budgetScript, /INITIAL_JS_GZIP_BUDGET\s*=\s*(1[3-9][0-9]|[2-9][0-9]{2})\s*\*/);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:whole-app-excellence-pr01"/);
assert.match(pkg, /"test:bundle-budget"/);
assert.match(pkg, /"capture:whole-app-baseline"/);

console.log("whole-app-excellence-pr01-gate.test.ts: ok");
