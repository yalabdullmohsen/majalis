/**
 * بوابة PR-4: فهرس البحوث + بحث + فلاتر على /academic-research.
 * تشغيل: node --import tsx src/lib/__tests__/memorization-research-pr4-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

assert.ok(existsSync(resolve(majalisRoot, "src/lib/scholarly-research/search.ts")));
assert.ok(existsSync(resolve(majalisRoot, "src/lib/researches/facets.ts")));

const page = readPkg("src/views/AcademicResearchPage.tsx");
assert.match(page, /FilterSheet/);
assert.match(page, /SCHOLARLY_SUGGEST_CTA/);
assert.match(page, /SCHOLARLY_RESEARCH_DISCLAIMER/);
assert.match(page, /عرض التفاصيل/);
assert.match(page, /الماجستير/);
assert.match(page, /الدكتوراه/);
assert.match(page, /extractPublishedResearchFacets/);
assert.doesNotMatch(page, /انشر بحثًا/);
assert.match(page, /اقترح بحثًا|SCHOLARLY_SUGGEST_CTA/);
assert.doesNotMatch(page, /موافق لأهل السنة والجماعة/);

const {
  SCHOLARLY_SUGGEST_CTA,
  SCHOLARLY_FORBIDDEN_PUBLISH_CTA,
  SCHOLARLY_RESEARCH_DISCLAIMER,
  countPublishedScholarlyResearch,
  searchPublishedScholarlyResearch,
} = await import("../scholarly-research/index.ts");

assert.equal(SCHOLARLY_SUGGEST_CTA, "اقترح بحثًا");
assert.equal(SCHOLARLY_FORBIDDEN_PUBLISH_CTA, "انشر بحثًا");
assert.match(SCHOLARLY_RESEARCH_DISCLAIMER, /لا يعني اعتماد جميع نتائجه/);
assert.equal(countPublishedScholarlyResearch(), 0);
assert.equal(searchPublishedScholarlyResearch({ q: "فقه" }).length, 0);

const { extractPublishedResearchFacets, RESEARCH_ACCESS_LABELS, queryPublished } =
  await import("../researches/index.ts");

const facets = extractPublishedResearchFacets();
assert.ok(Array.isArray(facets.universities));
assert.ok(RESEARCH_ACCESS_LABELS.metadata_only);
const published = queryPublished({});
assert.ok(published.every((r) => r.reviewStatus === "published"));

const pkg = readPkg("package.json");
assert.match(pkg, /"test:memorization-research-pr4"/);

assert.match(
  readRepo("docs/REPO_INDEX.md"),
  /PR-4|memorization-research-pr4|بحوث|academic-research/,
);

console.log("memorization-research-pr4-gate.test.ts: ok");
