/**
 * بوابة PR-0: جرد سبب جذري لتجربة المصحف (بلا إصلاح Geometry/نص).
 * Run: node --import tsx src/lib/__tests__/mushaf-experience-pr0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readMaj = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const reportPath = resolve(repoRoot, "docs/mushaf/MUSHAF_EXPERIENCE_ROOT_CAUSE.md");
const metricsPath = resolve(repoRoot, "docs/mushaf/mushaf-experience-pr0-metrics.json");
assert.ok(existsSync(reportPath), "root-cause report required");
assert.ok(existsSync(metricsPath), "metrics json required");

const report = readRepo("docs/mushaf/MUSHAF_EXPERIENCE_ROOT_CAUSE.md");
const metrics = JSON.parse(readRepo("docs/mushaf/mushaf-experience-pr0-metrics.json")) as {
  stage: number;
  productPatchInThisPr: boolean;
  instrumentationOnly: boolean;
  domPageWindow: number;
  acceptanceClaimForbidden: string;
  quranFingerprint: { codesSha: string; mushafId: number };
  experienceMarks: string[];
  confirmedCauses: string[];
  absentCauses: string[];
  notMeasuredThisRun: string[];
};

assert.equal(metrics.stage, 0);
assert.equal(metrics.productPatchInThisPr, false);
assert.equal(metrics.instrumentationOnly, true);
assert.equal(metrics.domPageWindow, 3);
assert.equal(metrics.acceptanceClaimForbidden, "SUNNAH_MUSHAF_EXPERIENCE_COMPLETE");
assert.equal(metrics.quranFingerprint.mushafId, 1);

assert.match(report, /PARTIAL/);
assert.match(report, /لا إعلان|ممنوع في هذه المرحلة/);
assert.match(report, /SUNNAH_MUSHAF_EXPERIENCE_COMPLETE/);
assert.match(report, /NewMushafReader/);
assert.match(report, /MushafPager/);
assert.match(report, /ALL_PAGES_RENDERED/);
assert.match(report, /EXCESSIVE_PAGE_DOM/);
assert.match(report, /AUDIO_STATE_RERENDER/);
assert.match(report, /headerSurahName/);
assert.match(report, /MushafPageSurahLabel/);
assert.match(report, /MushafSelectionController/);
assert.match(report, /goToNextMushafPage/);
assert.match(report, /NOT MEASURED/);
assert.match(report, /RELEASE_BLOCKER_CRITICAL/);
assert.doesNotMatch(report, /أسرع بنسبة \d+%/);
assert.doesNotMatch(report, /رفع Bundle Budget/);

assert.ok(metrics.absentCauses.includes("ALL_PAGES_RENDERED"));
assert.ok(metrics.confirmedCauses.includes("GLOBAL_STORE_SUBSCRIPTION"));
assert.ok(metrics.confirmedCauses.includes("AUDIO_STATE_RERENDER"));
assert.ok(metrics.notMeasuredThisRun.includes("testflight"));
assert.ok(metrics.experienceMarks.includes("mushaf:route-start"));
assert.ok(metrics.experienceMarks.includes("mushaf:flip-complete"));
assert.ok(metrics.experienceMarks.includes("mushaf:selection-complete"));

const source = JSON.parse(readMaj("public/data/quran-v2/SOURCE.json")) as {
  fingerprint: { codesSha: string; textsSha: string; verseOrderSha: string };
};
assert.equal(source.fingerprint.codesSha, metrics.quranFingerprint.codesSha);

assert.ok(existsSync(resolve(majalisRoot, "src/features/mushaf-reader/NewMushafReader.tsx")));
assert.ok(existsSync(resolve(majalisRoot, "src/features/mushaf-reader/MushafPager.tsx")));
assert.ok(existsSync(resolve(majalisRoot, "src/features/mushaf-reader/mushaf-experience-perf.ts")));
assert.ok(existsSync(resolve(majalisRoot, "src/pages/quran/MushafReaderPage.tsx")));

const perf = readMaj("src/features/mushaf-reader/mushaf-experience-perf.ts");
assert.match(perf, /mushaf:route-start/);
assert.match(perf, /mushaf:reader-mounted/);
assert.match(perf, /mushaf:page-data-ready/);
assert.match(perf, /mushaf:font-ready/);
assert.match(perf, /mushaf:first-page-rendered/);
assert.match(perf, /mushaf:first-stable-frame/);
assert.match(perf, /mushaf:flip-start/);
assert.match(perf, /mushaf:flip-complete/);
assert.match(perf, /mushaf:selection-start/);
assert.match(perf, /mushaf:selection-complete/);

const pager = readMaj("src/features/mushaf-reader/MushafPager.tsx");
assert.match(pager, /role: "next"/);
assert.match(pager, /role: "current"/);
assert.match(pager, /role: "prev"/);

const readerPage = readMaj("src/pages/quran/MushafReaderPage.tsx");
assert.match(readerPage, /mushaf:route-start/);
assert.match(readerPage, /NewMushafReader as MushafViewport/);

console.log("mushaf-experience-pr0-gate.test.ts: ok");
