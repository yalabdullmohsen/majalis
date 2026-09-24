/**
 * بوابة PR-0: إعادة بناء قصص الأنبياء — جرد + Baseline فقط (بلا إصلاح منتج).
 * تشغيل: node --import tsx src/lib/__tests__/prophets-stories-rebuild-pr0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROPHETS } from "@/lib/prophets-data";
import { isImmersiveChromePath, isPinnedChromePath } from "@/lib/immersive-chrome";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const reportPath = resolve(repoRoot, "docs/design/PROPHETS_STORIES_REBUILD_BASELINE.md");
const metricsPath = resolve(repoRoot, "docs/design/prophets-stories-rebuild-pr0-metrics.json");

assert.ok(existsSync(reportPath), "PROPHETS_STORIES_REBUILD_BASELINE.md مطلوب");
assert.ok(existsSync(metricsPath), "prophets-stories-rebuild-pr0-metrics.json مطلوب");

const report = readRepo("docs/design/PROPHETS_STORIES_REBUILD_BASELINE.md");
const metrics = JSON.parse(readRepo("docs/design/prophets-stories-rebuild-pr0-metrics.json")) as {
  stage: string;
  status: string;
  acceptedClaim: boolean;
  productUiChanged: boolean;
  prophetCount: number;
  screenshots: string;
};

assert.match(report, /PR-0/);
assert.match(report, /512db452f8fd662967a67aef1fbb60914dc8fa45|512db452f8fd/);
assert.match(report, /PARTIAL/);
assert.match(report, /NOT CAPTURED|NOT_CAPTURED/);
assert.match(report, /#0[Bb]1[Aa]2[Ee]/);
assert.match(report, /isPinnedChromePath/);
assert.match(report, /ProphetStoriesPage/);
assert.match(report, /prophet-stories\.css/);
assert.match(report, /لا إعلان|PROPHETS_STORIES_REBUILD_COMPLETE/);
assert.doesNotMatch(report, /PROPHETS_STORIES_REBUILD_COMPLETE\s*=\s*true/);

assert.equal(metrics.stage, "PR-0");
assert.equal(metrics.status, "PARTIAL");
assert.equal(metrics.acceptedClaim, false);
assert.equal(metrics.productUiChanged, false);
assert.equal(metrics.prophetCount, 25);
assert.equal(metrics.screenshots, "NOT_CAPTURED");

assert.equal(PROPHETS.length, 25);
assert.equal(isImmersiveChromePath("/prophets/adam"), false, "الأنبياء ليست Immersive بعد");
assert.equal(isPinnedChromePath("/prophets/adam"), true, "الأنبياء Pinned — BottomNav يظهر");

const css = readPkg("src/styles/pages/prophet-stories.css");
const navyHits = (css.match(/#0[Bb]1[Aa]2[Ee]/g) ?? []).length;
assert.ok(navyHits >= 8, `كحلي #0B1A2E ما زال في CSS (وُجد ${navyHits}) — جرد PR-0`);

const view = readPkg("src/views/ProphetStoriesPage.tsx");
assert.match(view, /prophet-lux-card/);
assert.match(view, /prophets-lux-tabs/);
assert.match(view, /prophet-detail-lux/);
assert.match(view, /نبذة/);
assert.match(view, /المعجزة|المعجزات/);

/* PR-0 لا يقدّم Reader مركّزًا بعد */
assert.doesNotMatch(view, /StoryReaderHeader|ProphetStoryReader/);
assert.doesNotMatch(css, /--prophets-background\s*:/);

console.log("prophets-stories-rebuild-pr0-gate.test.ts: ok");
