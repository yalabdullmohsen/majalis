/**
 * بوابة Baseline لمشروع Mushaf Next-Gen (PR-1).
 * تمنع فقدان وثيقة القياس وعقود الكاش/الـChrome/التليمتری دون تعديل نص القرآن.
 *
 * Run: node --import tsx src/lib/__tests__/mushaf-nextgen-baseline-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const majalisRoot = resolve(here, "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readMaj = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const baselinePath = resolve(repoRoot, "docs/mushaf/MUSHAF_NEXT_GEN_BASELINE.md");
assert.ok(existsSync(baselinePath), "docs/mushaf/MUSHAF_NEXT_GEN_BASELINE.md مطلوب");
const baseline = readRepo("docs/mushaf/MUSHAF_NEXT_GEN_BASELINE.md");

assert.match(baseline, /6788f6dd0|6788f6dd067960c1a4c2a01cdffd2052347bd1aa/);
assert.match(baseline, /MushafReaderPage/);
assert.match(baseline, /24\.50/);
assert.match(baseline, /MAX_ENTRIES[\s\S]*16|MAX_ENTRIES.*\*\*16\*\*/);
assert.match(baseline, /MUSHAF_CHROME_HIDE_MS = 4000/);
assert.match(baseline, /غير مقيس/);
assert.match(baseline, /390×844|390x844/);
assert.match(baseline, /1024×1366|1024x1366/);
assert.match(baseline, /pages=\*\*604\*\*/);
assert.match(baseline, /ayahs=\*\*6236\*\*/);

const evidenceDir = resolve(repoRoot, "docs/mushaf/baseline/next-gen-pr1");
for (const name of [
  "measure-iphone-390x844.json",
  "measure-ipad-1024x1366.json",
  "measure-iphone-pro-max-430x932.json",
  "summary.json",
  "route-chunks.json",
  "render-cache-probe.json",
]) {
  assert.ok(existsSync(resolve(evidenceDir, name)), `دليل قياس ناقص: ${name}`);
}

const iphone = JSON.parse(readRepo("docs/mushaf/baseline/next-gen-pr1/measure-iphone-390x844.json"));
const pages = (iphone.measurements as { page: number; ok: boolean; pageOverflow: boolean; lineOverflow: boolean; overlap: boolean }[])
  .map((m) => m.page)
  .sort((a, b) => a - b);
assert.deepEqual(pages, [1, 2, 5, 100, 221, 459, 604]);
for (const m of iphone.measurements as { ok: boolean; pageOverflow: boolean; lineOverflow: boolean; overlap: boolean }[]) {
  assert.equal(m.ok, true);
  assert.equal(m.pageOverflow, false);
  assert.equal(m.lineOverflow, false);
  assert.equal(m.overlap, false);
}

const cache = readMaj("src/features/mushaf-reader/mushaf-page-render-cache.ts");
assert.match(cache, /MAX_ENTRIES\s*=\s*16/);
assert.match(cache, /getCachedPageRenderModel/);
assert.match(cache, /putPageRenderModel/);

const telemetry = readMaj("src/features/mushaf-reader/mushaf-turn-telemetry.ts");
for (const mark of [
  "touchStart",
  "firstPageMovement",
  "transitionSettled",
  "activePageCommit",
  "pageRenderCount",
]) {
  assert.match(telemetry, new RegExp(mark));
}

const controls = readMaj("src/features/mushaf-reader/MushafControlsLayer.tsx");
assert.match(controls, /nm-controls__exit/);
assert.match(controls, /بحث في القرآن/);
assert.match(controls, /فهرس السور/);
assert.match(controls, /المزيد من إعدادات المصحف/);
assert.match(controls, /تشغيل الصفحة/);

const chromeCss = readMaj("src/styles/reader-page-chrome.css");
assert.match(chromeCss, /--nm-chrome-exit-min:\s*2\.75rem/);
assert.match(chromeCss, /--nm-chrome-arrow-size:\s*2\.5rem/);
assert.match(chromeCss, /--nm-chrome-arrow-touch:\s*2\.75rem/);

const bands = readMaj("src/features/mushaf-madinah/layout-bands.ts");
assert.match(bands, /MUSHAF_CHROME_HIDE_MS\s*=\s*4000/);

const pkg = JSON.parse(readMaj("package.json")) as { scripts: Record<string, string> };
assert.match(pkg.scripts["test:mushaf-gates:unit"] || "", /mushaf-nextgen-baseline-gate/);

console.log("mushaf-nextgen-baseline-gate.test.ts: ok");
