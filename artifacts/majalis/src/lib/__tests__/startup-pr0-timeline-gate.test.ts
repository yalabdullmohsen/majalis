/**
 * بوابة PR-0: Startup timeline + baseline + DEV marks (قياس/جرد فقط).
 * تشغيل: node --import tsx src/lib/__tests__/startup-pr0-timeline-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const reportPath = resolve(repoRoot, "docs/performance/STARTUP_ROOT_CAUSE_REPORT.md");
const metricsPath = resolve(repoRoot, "docs/performance/startup-pr0-baseline-metrics.json");
const marksPath = resolve(majalisRoot, "src/lib/startup-performance-marks.ts");

assert.ok(existsSync(reportPath), "STARTUP_ROOT_CAUSE_REPORT.md مطلوب");
assert.ok(existsSync(metricsPath), "startup-pr0-baseline-metrics.json مطلوب");
assert.ok(existsSync(marksPath), "startup-performance-marks.ts مطلوب");

const report = readRepo("docs/performance/STARTUP_ROOT_CAUSE_REPORT.md");
assert.match(report, /Startup Root Cause Report|PR-0/);
assert.match(report, /NOT MEASURED/);
assert.match(report, /c7816065a|Base commit/);
assert.match(report, /startup:js-start/);
assert.match(report, /startup:shell-ready/);
assert.match(report, /AppStartupController/);
assert.match(report, /OfflineBanner|محفوظ محليًا/);
assert.match(report, /تحديث العرض/);
assert.match(report, /ChunkRecoveryToast|جاري تحسين العرض/);
assert.match(report, /ChromeNavFallback/);
assert.match(report, /لا إعلان|SUNNAH_STARTUP_STABLE_AND_RELEASE_READY/);
assert.doesNotMatch(report, /SUNNAH_STARTUP_STABLE_AND_RELEASE_READY\s*=\s*true/);
assert.doesNotMatch(report, /أسرع بنسبة \d+%/);

const metrics = JSON.parse(readRepo("docs/performance/startup-pr0-baseline-metrics.json")) as {
  program: string;
  stage: number;
  commit: string;
  acceptanceClaimForbiddenUntilLater: string;
  devMarks: string[];
  marksWiredInPr0: string[];
  marksDeferred: Array<{ name: string }>;
  runtimeNotMeasuredThisRun: string[];
};

assert.equal(metrics.program, "sunnah-startup-pipeline-rebuild");
assert.equal(metrics.stage, 0);
assert.match(metrics.commit, /^[0-9a-f]{40}$/);
assert.equal(metrics.acceptanceClaimForbiddenUntilLater, "SUNNAH_STARTUP_STABLE_AND_RELEASE_READY");
assert.ok(metrics.devMarks.includes("startup:native-end"));
assert.ok(metrics.devMarks.includes("startup:cache-ready"));
assert.ok(metrics.devMarks.includes("startup:stable"));
assert.ok(metrics.marksWiredInPr0.includes("startup:js-start"));
assert.ok(metrics.marksWiredInPr0.includes("startup:root-mounted"));
assert.ok(metrics.marksDeferred.some((d) => d.name === "startup:cache-ready"));
assert.ok(metrics.runtimeNotMeasuredThisRun.includes("clsColdStart"));
assert.ok(metrics.runtimeNotMeasuredThisRun.includes("deviceScreenshots"));

const marksSrc = readPkg("src/lib/startup-performance-marks.ts");
assert.match(marksSrc, /markStartup/);
assert.match(marksSrc, /import\.meta\.env\?\.DEV/);
assert.match(marksSrc, /__SUNNAH_STARTUP_MARKS__/);
assert.doesNotMatch(marksSrc, /setTimeout\s*\(\s*.*markStartup/);
for (const name of metrics.devMarks) {
  assert.match(marksSrc, new RegExp(name.replace(":", "\\:")));
}

const main = readPkg("src/main.tsx");
assert.match(main, /markStartup\("startup:js-start"\)/);
assert.match(main, /markStartup\("startup:root-mounted"\)/);
assert.match(main, /markStartup\("startup:theme-ready"\)/);
assert.match(main, /markStartup\("startup:fonts-ready"\)/);
assert.match(main, /markStartup\("startup:session-ready"\)/);
assert.match(main, /markStartup\("startup:content-ready"\)/);

const splash = readPkg("src/lib/splash-screen.ts");
assert.match(splash, /markStartup\("startup:native-end"\)/);

const shell = readPkg("src/lib/app-shell-stability.ts");
assert.match(shell, /markStartup\("startup:shell-ready"\)/);
assert.match(shell, /markStartup\("startup:stable"\)/);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:startup-pr0"/);

const repoIndex = readRepo("docs/REPO_INDEX.md");
assert.match(repoIndex, /STARTUP_ROOT_CAUSE_REPORT/);

console.log("startup-pr0-timeline-gate.test.ts: ok");
