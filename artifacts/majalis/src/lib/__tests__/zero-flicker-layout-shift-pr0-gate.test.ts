/**
 * بوابة PR-0: Zero Flicker / Layout Shift — جرد + خط أساس + علامات صلاة (بلا إصلاح منتج).
 * تشغيل: node --import tsx src/lib/__tests__/zero-flicker-layout-shift-pr0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const reportPath = resolve(repoRoot, "docs/performance/ZERO_FLICKER_LAYOUT_SHIFT_ROOT_CAUSE_PR0.md");
const metricsPath = resolve(repoRoot, "docs/performance/zero-flicker-pr0-baseline-metrics.json");
const prayerMarksPath = resolve(majalisRoot, "src/lib/prayer-performance-marks.ts");
const mountCountersPath = resolve(majalisRoot, "src/lib/dev-mount-counters.ts");

assert.ok(existsSync(reportPath), "ZERO_FLICKER_LAYOUT_SHIFT_ROOT_CAUSE_PR0.md مطلوب");
assert.ok(existsSync(metricsPath), "zero-flicker-pr0-baseline-metrics.json مطلوب");
assert.ok(existsSync(prayerMarksPath), "prayer-performance-marks.ts مطلوب");
assert.ok(existsSync(mountCountersPath), "dev-mount-counters.ts مطلوب");

const report = readRepo("docs/performance/ZERO_FLICKER_LAYOUT_SHIFT_ROOT_CAUSE_PR0.md");
assert.match(report, /PR-0/);
assert.match(report, /NOT MEASURED/);
assert.match(report, /07d580b0afdfc65ce9142129a73c6201f1e47854|07d580b0a/);
assert.match(report, /SKELETON_SIZE_MISMATCH/);
assert.match(report, /ASYNC_DATA_LAYOUT_SHIFT/);
assert.match(report, /PRAYER_CALCULATION_SHIFT|PRAYER_LOCATION_SHIFT/);
assert.match(report, /تحديث العرض/);
assert.match(report, /FONT_SWAP_LAYOUT_SHIFT/);
assert.match(report, /LazyRouteFallback|PAGE_REMOUNT/);
assert.match(report, /deferMs|20_000|20000/);
assert.match(report, /PARTIAL/);
assert.match(report, /لا إعلان|SUNNAH_ZERO_FLICKER_AND_LAYOUT_SHIFT_COMPLETE/);
assert.doesNotMatch(report, /SUNNAH_ZERO_FLICKER_AND_LAYOUT_SHIFT_COMPLETE\s*=\s*true/);
assert.doesNotMatch(report, /COMPLETE\s*$/m);

const metrics = JSON.parse(readRepo("docs/performance/zero-flicker-pr0-baseline-metrics.json")) as {
  program: string;
  stage: number;
  commit: string;
  acceptanceClaimForbiddenUntilLater: string;
  confirmedRootCauses: string[];
  prayerMarks: string[];
  prayerMarksWiredInPr0: string[];
  runtimeMetrics: Record<string, number | null>;
  runtimeNotMeasuredThisRun: string[];
};

assert.equal(metrics.program, "sunnah-zero-flicker-layout-shift");
assert.equal(metrics.stage, 0);
assert.match(metrics.commit, /^[0-9a-f]{40}$/);
assert.equal(
  metrics.acceptanceClaimForbiddenUntilLater,
  "SUNNAH_ZERO_FLICKER_AND_LAYOUT_SHIFT_COMPLETE",
);
assert.ok(metrics.confirmedRootCauses.includes("SKELETON_SIZE_MISMATCH"));
assert.ok(metrics.confirmedRootCauses.includes("ASYNC_DATA_LAYOUT_SHIFT"));
assert.ok(metrics.confirmedRootCauses.includes("CHUNK_LOAD_FAILURE"));
assert.ok(metrics.prayerMarks.includes("prayer:route-mount"));
assert.ok(metrics.prayerMarks.includes("prayer:interactive"));
assert.ok(metrics.prayerMarksWiredInPr0.includes("prayer:route-mount"));
assert.ok(metrics.prayerMarksWiredInPr0.includes("prayer:calculation-ready"));
assert.equal(metrics.runtimeMetrics.clsColdStart, null);
assert.equal(metrics.runtimeMetrics.prayerPageMountCount, null);
assert.ok(metrics.runtimeNotMeasuredThisRun.includes("clsPrayerEntry"));
assert.ok(metrics.runtimeNotMeasuredThisRun.includes("testFlightRecording"));

const prayerMarksSrc = readPkg("src/lib/prayer-performance-marks.ts");
assert.match(prayerMarksSrc, /markPrayer/);
assert.match(prayerMarksSrc, /import\.meta\.env\?\.DEV/);
assert.match(prayerMarksSrc, /__SUNNAH_PRAYER_MARKS__/);
assert.doesNotMatch(prayerMarksSrc, /setTimeout\s*\(\s*.*markPrayer/);
for (const name of metrics.prayerMarks) {
  assert.match(prayerMarksSrc, new RegExp(name.replace(":", "\\:")));
}

const mountSrc = readPkg("src/lib/dev-mount-counters.ts");
assert.match(mountSrc, /recordDevMount/);
assert.match(mountSrc, /prayerPage/);
assert.match(mountSrc, /import\.meta\.env\?\.DEV/);

const hook = readPkg("src/hooks/usePrayerCountdown.ts");
assert.match(hook, /markPrayer\("prayer:cached-data-ready"\)/);
assert.match(hook, /markPrayer\("prayer:calculation-ready"\)/);
assert.match(hook, /markPrayer\("prayer:timezone-ready"\)/);

const view = readPkg("src/pages/worship/ui/PrayerTimesView.tsx");
assert.match(view, /markPrayer\("prayer:route-mount"\)/);
assert.match(view, /markPrayer\("prayer:first-frame"\)/);
assert.match(view, /markPrayer\("prayer:interactive"\)/);
assert.match(view, /recordDevMount\("prayerPage"\)/);
assert.match(view, /!countdown\?\.next/);
assert.match(view, /pts-hint--skeleton/);
assert.match(view, /pts-hero/);

const boundary = readPkg("src/components/ErrorBoundary.tsx");
assert.match(boundary, /تحديث العرض/);

const chunk = readPkg("src/lib/chunk-recovery.ts");
assert.match(chunk, /تحسين العرض/);

const app = readPkg("src/App.tsx");
assert.match(app, /deferMs=\{isHomePath \? 20_000 : 0\}/);

const fontsUi = readPkg("src/styles/fonts-ui.css");
assert.match(fontsUi, /font-display:\s*optional/);

console.log("zero-flicker-layout-shift-pr0-gate: PASS");
