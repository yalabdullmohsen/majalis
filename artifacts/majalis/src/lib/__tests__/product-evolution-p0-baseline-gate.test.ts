/**
 * بوابة المرحلة 0 لبرنامج تطوير سُنّة:
 * توثيق خط الأساس + ربط بوابات منع التراجع بدون تخفيف ميزانيات.
 * تشغيل: node --import tsx src/lib/__tests__/product-evolution-p0-baseline-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const baselineMd = resolve(repoRoot, "docs/product-evolution/BASELINE.md");
const metricsPath = resolve(repoRoot, "docs/product-evolution/baseline-metrics.json");

assert.ok(existsSync(baselineMd), "BASELINE.md مطلوب");
assert.ok(existsSync(metricsPath), "baseline-metrics.json مطلوب");

const baseline = readRepo("docs/product-evolution/BASELINE.md");
assert.match(baseline, /المرحلة 0/, "عنوان المرحلة 0");
assert.match(baseline, /Entry JS gzip/, "قسم Bundle");
assert.match(baseline, /NOT MEASURED/, "مقاييس غير المقاسة موثّقة بلا اختراع");
assert.match(baseline, /test:bundle-budget/, "أداة الميزانية");
assert.match(baseline, /startup-readiness-gate/, "بوابة جاهزية الإقلاع");
assert.match(baseline, /startup-shell-stability-gate/, "بوابة استقرار الهيكل");
assert.doesNotMatch(baseline, /سريع جدًا|أسرع بنسبة \d+%/, "لا ادّعاءات تسويقية بلا قياس");

const metrics = JSON.parse(readRepo("docs/product-evolution/baseline-metrics.json")) as {
  commit: string;
  stage: number;
  bundle: { entryJs: { gzipKiB: number; budgetKiB: number; gate: string } };
  notMeasuredThisRun: string[];
};

assert.equal(metrics.stage, 0);
assert.match(metrics.commit, /^[0-9a-f]{40}$/);
assert.equal(metrics.bundle.entryJs.gate, "pass");
assert.ok(metrics.bundle.entryJs.gzipKiB <= metrics.bundle.entryJs.budgetKiB + 0.4);
assert.ok(metrics.notMeasuredThisRun.includes("coldStartMs"));
assert.ok(metrics.notMeasuredThisRun.includes("clickToShellMs"));

const pkg = readPkg("package.json");
assert.match(pkg, /"test:product-evolution-p0"/, "سكربت P0 موجود");
assert.match(pkg, /test:product-evolution-p0/, "P0 مربوط من سكربت آخر");
assert.match(pkg, /"test:bundle-budget"/);
assert.match(pkg, /"test:unified-search"/);
assert.match(pkg, /"test:lessons-domain"/);
assert.match(pkg, /"verify:pageshell-gate"/);
assert.match(pkg, /"test:mushaf-page-flip"/);
assert.match(pkg, /"test:nav-active"/);
assert.match(pkg, /"test:launch-splash-unified"/);

const requiredGates = [
  "src/lib/__tests__/startup-readiness-gate.test.ts",
  "src/lib/__tests__/startup-shell-stability-gate.test.ts",
  "src/lib/__tests__/page-transitions-gate.test.ts",
  "src/lib/__tests__/lesson-detail-progressive-gate.test.ts",
  "src/lib/__tests__/mushaf-anti-regression-guard.test.ts",
  "scripts/test-bundle-budget.mjs",
  "scripts/verify-pageshell-gate.mjs",
] as const;

for (const rel of requiredGates) {
  assert.ok(existsSync(resolve(majalisRoot, rel)), `مفقود: ${rel}`);
}

const budgetScript = readPkg("scripts/test-bundle-budget.mjs");
assert.match(budgetScript, /INITIAL_JS_GZIP_BUDGET\s*=\s*120\s*\*\s*1024\s*\+\s*320/);
assert.doesNotMatch(budgetScript, /INITIAL_JS_GZIP_BUDGET\s*=\s*(1[3-9][0-9]|[2-9][0-9]{2})\s*\*/);

console.log("product-evolution-p0-baseline-gate.test.ts: ok");
