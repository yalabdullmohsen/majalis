/**
 * بوابة PR-2: صفحة مسار الحفظ + صفحات المسار/التصنيف/محفوظاتي خلف Flags OFF.
 * تشغيل: node --import tsx src/lib/__tests__/memorization-research-pr2-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const hub = readPkg("src/pages/hifz-path/HifzPathPage.tsx");
assert.match(hub, /PageHeaderV2/);
assert.match(hub, /متابعة الحفظ/);
assert.match(hub, /مراجعات اليوم/);
assert.match(hub, /المسارات المقترحة/);
assert.match(hub, /التصنيفات/);
assert.match(hub, /محفوظاتي/);
assert.match(hub, /EmptyStateV2/);
assert.match(hub, /ContentRow/);
assert.match(hub, /HIFZ_PATH_USER_TAGLINE/);
assert.doesNotMatch(hub, /كل ما يجب على المسلم حفظه/);
assert.doesNotMatch(hub, /شهادة حفظ/);
assert.match(hub, /isHifzPathEnabled/);
assert.match(hub, /Redirect to="\/memorization"/);

for (const rel of [
  "src/pages/hifz-path/HifzPathMyPage.tsx",
  "src/pages/hifz-path/HifzPathCategoryPage.tsx",
  "src/pages/hifz-path/HifzPathDetailPage.tsx",
  "src/pages/hifz-path/HifzPathUnitPage.tsx",
  "src/pages/hifz-path/HifzPathRow.tsx",
]) {
  assert.ok(existsSync(resolve(majalisRoot, rel)), rel);
  const src = readPkg(rel);
  assert.match(src, /isHifzPathEnabled|HifzPath/);
  assert.doesNotMatch(src, /كل ما يجب على المسلم حفظه/);
}

assert.ok(!existsSync(resolve(majalisRoot, "src/pages/hifz-path/HifzPathChildPage.tsx")));

const appRoutes = readPkg("src/AppRoutes.tsx");
assert.match(appRoutes, /HifzPathMyPage/);
assert.match(appRoutes, /HifzPathCategoryPage/);
assert.match(appRoutes, /HifzPathDetailPage/);
assert.match(appRoutes, /HifzPathUnitPage/);
assert.doesNotMatch(appRoutes, /HifzPathChildPage/);

const {
  countPublishedHifzPaths,
  getHifzContinueTarget,
  listHifzDueReviewsToday,
  listPublishedHifzPathsByCategory,
  hifzCategoryLabel,
  isHifzCategory,
  isHifzPathEnabled,
  resetMemorizationResearchFlags,
  HIFZ_CATEGORIES,
  HIFZ_COMPLETION_CTA,
} = await import("../memorization-path/index.ts");

resetMemorizationResearchFlags();
assert.equal(isHifzPathEnabled(), false);
assert.equal(countPublishedHifzPaths(), 0);
assert.equal(getHifzContinueTarget(), null);
assert.equal(listHifzDueReviewsToday().length, 0);
assert.equal(listPublishedHifzPathsByCategory("quran").length, 0);
assert.equal(hifzCategoryLabel("quran"), "القرآن الكريم");
assert.equal(isHifzCategory("quran"), true);
assert.equal(isHifzCategory("not-a-category"), false);
assert.equal(HIFZ_CATEGORIES.length, 8);
assert.match(HIFZ_COMPLETION_CTA.completedUnit, /أتممت هذه الوحدة/);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:memorization-research-pr2"/);

assert.match(
  readRepo("docs/REPO_INDEX.md"),
  /PR-2|memorization-research-pr2|مسار الحفظ.*PR-2/,
);

console.log("memorization-research-pr2-gate.test.ts: ok");
