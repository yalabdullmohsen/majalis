/**
 * بوابة PR-0: عقود مسار الحفظ + البحوث الشرعية (Flags OFF · بلا Routes عامة).
 * تشغيل: node --import tsx src/lib/__tests__/memorization-research-pr0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

assert.ok(existsSync(resolve(repoRoot, "docs/memorization-research/PR0_CONTRACTS.md")));
assert.ok(existsSync(resolve(repoRoot, "docs/memorization-research/README.md")));
assert.ok(existsSync(resolve(repoRoot, "docs/memorization-research/OWNER_ACTIONS.md")));
assert.ok(existsSync(resolve(repoRoot, "docs/memorization-research/path-templates.json")));
assert.ok(existsSync(resolve(repoRoot, "docs/memorization-research/research-inventory.json")));

const contracts = readRepo("docs/memorization-research/PR0_CONTRACTS.md");
assert.match(contracts, /\*\*PARTIAL\*\*|PARTIAL/);
assert.match(contracts, /مسارات مقترحة للحفظ بحسب المستوى والهدف/);
assert.doesNotMatch(contracts, /SUNNAH_MEMORIZATION_AND_RESEARCH_READY\s*=\s*true/);
assert.match(contracts, /Feature Flags|Flags OFF|OFF/);
assert.match(contracts, /\/hifz-path/);
assert.match(contracts, /\/academic-research/);
assert.match(contracts, /lib\/researches/);
assert.match(contracts, /لا مسار موازٍ|لا بناء UI موازٍ/);

const templates = JSON.parse(
  readRepo("docs/memorization-research/path-templates.json"),
) as {
  publishedCount: number;
  forbiddenTagline: string;
  templates: Array<{ publicationStatus: string }>;
};
assert.equal(templates.publishedCount, 0);
assert.match(templates.forbiddenTagline, /كل ما يجب على المسلم حفظه/);
assert.ok(templates.templates.length >= 10);
assert.ok(
  templates.templates.every((t) => t.publicationStatus === "DRAFT"),
  "كل القوالب DRAFT",
);

const inventory = JSON.parse(
  readRepo("docs/memorization-research/research-inventory.json"),
) as {
  indexedPublishedCount: number;
  pdfUploadInV1: boolean;
  legacySurface?: { route: string };
};
assert.equal(inventory.indexedPublishedCount, 0);
assert.equal(inventory.pdfUploadInV1, false);
assert.equal(inventory.legacySurface?.route, "/academic-research");

const {
  MEMORIZATION_RESEARCH_FLAGS_DEFAULT,
  isHifzPathEnabled,
  isScholarlyResearchEnabled,
  resetMemorizationResearchFlags,
  setMemorizationResearchFlagsForTests,
  countPublishedHifzPaths,
  HIFZ_PATH_USER_TAGLINE,
  HIFZ_PATH_FORBIDDEN_TAGLINE,
  HIFZ_COMPLETION_CTA,
  canPublishHifzPath,
} = await import("../memorization-path/index.ts");

const {
  countPublishedScholarlyResearch,
  isSafeExternalHttpUrl,
  SCHOLARLY_RESEARCH_PDF_UPLOAD_ALLOWED,
  SCHOLARLY_SUGGEST_CTA,
  SCHOLARLY_FORBIDDEN_PUBLISH_CTA,
  SCHOLARLY_RESEARCH_DISCLAIMER,
  SCHOLARLY_METHODOLOGY_FORBIDDEN_PHRASE,
  roleCanPerformScholarlyReview,
  isScholarlyResearchPubliclyVisible,
} = await import("../scholarly-research/index.ts");

resetMemorizationResearchFlags();
assert.equal(MEMORIZATION_RESEARCH_FLAGS_DEFAULT.hifzPathEnabled, false);
assert.equal(MEMORIZATION_RESEARCH_FLAGS_DEFAULT.scholarlyResearchEnabled, false);
assert.equal(isHifzPathEnabled(), false);
assert.equal(isScholarlyResearchEnabled(), false);
assert.equal(countPublishedHifzPaths(), 0);
assert.equal(countPublishedScholarlyResearch(), 0);

assert.equal(HIFZ_PATH_USER_TAGLINE, "مسارات مقترحة للحفظ بحسب المستوى والهدف");
assert.match(HIFZ_PATH_FORBIDDEN_TAGLINE, /كل ما يجب على المسلم حفظه/);
assert.match(HIFZ_COMPLETION_CTA.completedUnit, /أتممت هذه الوحدة/);
assert.match(HIFZ_COMPLETION_CTA.savedToMine, /سجلتها ضمن محفوظاتي/);

assert.equal(
  canPublishHifzPath({
    publicationStatus: "DRAFT",
    reviewStatus: "APPROVED",
    licenseStatus: "PROJECT_QURAN",
    hasSourceReference: true,
  }),
  false,
);

assert.equal(SCHOLARLY_RESEARCH_PDF_UPLOAD_ALLOWED, false);
assert.equal(SCHOLARLY_SUGGEST_CTA, "اقترح بحثًا");
assert.equal(SCHOLARLY_FORBIDDEN_PUBLISH_CTA, "انشر بحثًا");
assert.match(SCHOLARLY_RESEARCH_DISCLAIMER, /لا يعني اعتماد جميع نتائجه/);
assert.match(SCHOLARLY_METHODOLOGY_FORBIDDEN_PHRASE, /موافق لأهل السنة/);

assert.equal(isSafeExternalHttpUrl("javascript:alert(1)"), false);
assert.equal(isSafeExternalHttpUrl("https://example.edu/thesis/1"), true);
assert.equal(isSafeExternalHttpUrl("http://localhost/x"), false);

assert.equal(roleCanPerformScholarlyReview("VIEWER", "methodology"), false);
assert.equal(roleCanPerformScholarlyReview("METHODOLOGY_REVIEWER", "methodology"), true);
assert.equal(isScholarlyResearchPubliclyVisible("SUBMITTED"), false);
assert.equal(isScholarlyResearchPubliclyVisible("APPROVED_EXTERNAL_LINK"), true);

setMemorizationResearchFlagsForTests({ hifzPathEnabled: true });
assert.equal(isHifzPathEnabled(), true);
resetMemorizationResearchFlags();
assert.equal(isHifzPathEnabled(), false);

/** PR-0 عقود؛ Routes أُضيفت في PR-1 خلف العلم — لا استيراد scholarly-research صفحة موازية */
const appRoutes = readPkg("src/AppRoutes.tsx");
assert.match(appRoutes, /path="\/scholarly-research"><Redirect to="\/academic-research"/);
assert.doesNotMatch(appRoutes, /component=\{ScholarlyResearchPage\}/);
assert.doesNotMatch(appRoutes, /lazy\(\(\) => import\([^)]*scholarly-research\//i);

const mainTsx = readPkg("src/main.tsx");
assert.doesNotMatch(mainTsx, /memorization-path|scholarly-research/);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:memorization-research-pr0"/);

assert.match(
  readRepo("docs/REPO_INDEX.md"),
  /memorization-research|مسار الحفظ|البحوث الشرعية/,
);

console.log("memorization-research-pr0-gate.test.ts: ok");
