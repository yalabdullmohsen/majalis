/**
 * بوابة PR-0: جرد إعادة بناء واجهة المصحف وفق المرجع (بلا إصلاح منتج).
 * Run: node --import tsx src/lib/__tests__/mushaf-reference-rebuild-pr0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readMaj = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const reportPath = resolve(repoRoot, "docs/mushaf/MUSHAF_REFERENCE_REBUILD_BASELINE.md");
const metricsPath = resolve(repoRoot, "docs/mushaf/mushaf-reference-rebuild-pr0-metrics.json");
assert.ok(existsSync(reportPath), "baseline report required");
assert.ok(existsSync(metricsPath), "metrics json required");

const report = readRepo("docs/mushaf/MUSHAF_REFERENCE_REBUILD_BASELINE.md");
const metrics = JSON.parse(readRepo("docs/mushaf/mushaf-reference-rebuild-pr0-metrics.json")) as {
  stage: number;
  productPatchInThisPr: boolean;
  quranFingerprint: { codesSha: string; mushafId: number };
  fontLicenseId: string;
};

assert.equal(metrics.stage, 0);
assert.equal(metrics.productPatchInThisPr, false);
assert.equal(metrics.quranFingerprint.mushafId, 1);
assert.match(report, /لا إصلاح منتج|بلا إصلاح منتج/);
assert.match(report, /PARTIAL/);
assert.match(report, /لا إعلان `MUSHAF_REFERENCE_REBUILD_COMPLETE`/);
assert.match(report, /BLOCKED_ASSET_LICENSE|pending-store-signoff|توقيع/);
assert.match(report, /MushafAyahMarker|MushafPage/);
assert.match(report, /#FCF6E3/);
assert.match(report, /#C9A82E/);
assert.match(report, /radial-gradient|Gradient/);

const source = JSON.parse(readMaj("public/data/quran-v2/SOURCE.json")) as {
  fingerprint: { codesSha: string; textsSha: string; verseOrderSha: string };
};
assert.equal(source.fingerprint.codesSha, metrics.quranFingerprint.codesSha);

const fonts = readdirSync(resolve(majalisRoot, "public/fonts/qpc-v2")).filter((f) =>
  f.endsWith(".woff2"),
);
assert.equal(fonts.length, 604);

assert.ok(existsSync(resolve(majalisRoot, "src/features/mushaf-reader/MushafAyahMarker.tsx")));
assert.ok(existsSync(resolve(majalisRoot, "src/features/mushaf-reader/MushafPage.tsx")));
assert.ok(existsSync(resolve(majalisRoot, "src/features/mushaf-reader/MushafOpeningSpreadLayout.tsx")));
assert.match(metrics.fontLicenseId, /pending-store-signoff/);

// لا تعديل منتج في هذا الـPR — الملفات الجوهرية للقارئ يجب ألا تكون ضمن diff المتعمّد
// (البوابة تتحقق من وجود الجرد فقط)

console.log("mushaf-reference-rebuild-pr0-gate.test.ts: ok");
