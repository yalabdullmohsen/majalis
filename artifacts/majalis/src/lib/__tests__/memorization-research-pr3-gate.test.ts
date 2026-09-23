/**
 * بوابة PR-3: تجربة الوحدة + تقدم/مراجعة محلي خلف Flags OFF.
 * تشغيل: node --import tsx src/lib/__tests__/memorization-research-pr3-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

assert.ok(existsSync(resolve(majalisRoot, "src/lib/memorization-path/progress-store.ts")));
assert.ok(existsSync(resolve(majalisRoot, "src/pages/hifz-path/HifzUnitPracticePanel.tsx")));

const practice = readPkg("src/pages/hifz-path/HifzUnitPracticePanel.tsx");
assert.match(practice, /isHifzPathPracticeEnabled/);
assert.match(practice, /HIFZ_COMPLETION_CTA/);
assert.match(practice, /أتممت هذه الوحدة|completedUnit/);
assert.match(practice, /سجلتها ضمن محفوظاتي|savedToMine/);
assert.match(practice, /resolveCanonicalAyahHref|فتح في المصحف/);
assert.match(practice, /ليس شهادة حفظ|بلا شهادة حفظ|ليس شهادة/);
assert.doesNotMatch(practice, /شهادة حفظ معتمدة|معتمد شرعيًا/);
assert.doesNotMatch(practice, /كل ما يجب على المسلم حفظه/);

const unitPage = readPkg("src/pages/hifz-path/HifzPathUnitPage.tsx");
assert.match(unitPage, /HifzUnitPracticePanel/);

const clearData = readPkg("src/lib/clear-user-local-data.ts");
assert.match(clearData, /ssunnah-hifz-path-progress-v1/);

const {
  MEMORIZATION_RESEARCH_FLAGS_DEFAULT,
  isHifzPathEnabled,
  isHifzPathPracticeEnabled,
  resetMemorizationResearchFlags,
  setMemorizationResearchFlagsForTests,
  HIFZ_COMPLETION_CTA,
  HIFZ_PROGRESS_USER_LABELS,
  getHifzContinueTarget,
  listHifzDueReviewsToday,
  resetHifzProgressStoreForTests,
  startHifzUnit,
  recordHifzRepetition,
  markHifzUnitSelfReported,
  markHifzUnitReviewed,
  listMyHifzUnits,
  refreshDueHifzReviews,
} = await import("../memorization-path/index.ts");

resetMemorizationResearchFlags();
resetHifzProgressStoreForTests();
assert.equal(MEMORIZATION_RESEARCH_FLAGS_DEFAULT.hifzPathPracticeEnabled, false);
assert.equal(isHifzPathEnabled(), false);
assert.equal(isHifzPathPracticeEnabled(), false);

setMemorizationResearchFlagsForTests({
  hifzPathEnabled: true,
  hifzPathPracticeEnabled: true,
});
assert.equal(isHifzPathPracticeEnabled(), true);

const id = {
  pathSlug: "test-path",
  pathTitle: "مسار اختبار",
  unitId: "u1",
  unitTitle: "وحدة اختبار",
};

resetHifzProgressStoreForTests();
assert.equal(getHifzContinueTarget(), null);
assert.equal(listHifzDueReviewsToday().length, 0);

const started = startHifzUnit(id);
assert.equal(started.state, "IN_PROGRESS");
assert.equal(HIFZ_PROGRESS_USER_LABELS[started.state], "قيد الحفظ");
assert.equal(getHifzContinueTarget()?.unitId, "u1");

const rep = recordHifzRepetition(id);
assert.equal(rep.repetitionCount, 1);

const saved = markHifzUnitSelfReported(id, { revisionIntervals: [1, 3] });
assert.equal(saved.state, "MEMORIZED_SELF_REPORTED");
assert.equal(
  HIFZ_PROGRESS_USER_LABELS[saved.state],
  "سجلتها ضمن محفوظاتي",
);
assert.ok(saved.nextReviewAt);
assert.equal(listMyHifzUnits().length, 1);
assert.match(HIFZ_COMPLETION_CTA.completedUnit, /أتممت هذه الوحدة/);

markHifzUnitSelfReported(id, { revisionIntervals: [1] });
refreshDueHifzReviews(new Date(Date.now() + 2 * 86400000));
const due = listHifzDueReviewsToday();
assert.ok(due.length >= 1, "مستحقة للمراجعة بعد انقضاء الفترة");

const reviewed = markHifzUnitReviewed(id, "ok", { revisionIntervals: [7] });
assert.equal(reviewed.state, "REVIEWED");
assert.equal(HIFZ_PROGRESS_USER_LABELS.REVIEWED, "روجعت");

const reinforce = markHifzUnitReviewed(id, "needs_reinforcement");
assert.equal(reinforce.state, "NEEDS_REINFORCEMENT");
assert.equal(HIFZ_PROGRESS_USER_LABELS.NEEDS_REINFORCEMENT, "تحتاج تثبيتًا");

// لا تخزين نص قرآن في المخزن
const storeSrc = readPkg("src/lib/memorization-path/progress-store.ts");
assert.doesNotMatch(storeSrc, /ayahText|quranText|verseText/);

resetMemorizationResearchFlags();
resetHifzProgressStoreForTests();
assert.equal(isHifzPathPracticeEnabled(), false);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:memorization-research-pr3"/);

assert.match(
  readRepo("docs/REPO_INDEX.md"),
  /PR-3|memorization-research-pr3|تقدم|ممارسة/,
);

console.log("memorization-research-pr3-gate.test.ts: ok");
