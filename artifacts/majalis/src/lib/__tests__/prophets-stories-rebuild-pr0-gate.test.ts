/**
 * بوابة PR-0 التاريخية: وثيقة الجرد تبقى مرجعًا؛ التنفيذ الحي في impl-gate.
 * تشغيل: node --import tsx src/lib/__tests__/prophets-stories-rebuild-pr0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROPHETS } from "@/lib/prophets-data";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const reportPath = resolve(repoRoot, "docs/design/PROPHETS_STORIES_REBUILD_BASELINE.md");
const metricsPath = resolve(repoRoot, "docs/design/prophets-stories-rebuild-pr0-metrics.json");

assert.ok(existsSync(reportPath), "PROPHETS_STORIES_REBUILD_BASELINE.md مطلوب كمرجع تاريخي");
assert.ok(existsSync(metricsPath), "prophets-stories-rebuild-pr0-metrics.json مطلوب");

const report = readRepo("docs/design/PROPHETS_STORIES_REBUILD_BASELINE.md");
const metrics = JSON.parse(readRepo("docs/design/prophets-stories-rebuild-pr0-metrics.json")) as {
  stage: string;
  status: string;
  acceptedClaim: boolean;
  productUiChanged: boolean;
  prophetCount: number;
};

assert.match(report, /PR-0/);
assert.match(report, /ProphetStoriesPage/);
assert.match(report, /prophet-stories\.css/);
assert.match(report, /#0[Bb]1[Aa]2[Ee]/);
assert.equal(metrics.stage, "PR-0");
assert.equal(metrics.acceptedClaim, false);
assert.equal(metrics.productUiChanged, false);
assert.equal(metrics.prophetCount, 25);
assert.equal(PROPHETS.length, 25);

console.log("prophets-stories-rebuild-pr0-gate.test.ts: ok (historical baseline only)");
