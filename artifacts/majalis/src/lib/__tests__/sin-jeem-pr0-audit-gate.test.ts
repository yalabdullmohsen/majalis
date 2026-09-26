/**
 * بوابة PR-0: جرد سين جيم — أعداد حية + مسارات + عزل فئة مكسور موثَّق.
 * Run: node --import tsx src/lib/__tests__/sin-jeem-pr0-audit-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFullQuizBank,
  getPublishedQuestionCount,
} from "@/data/quiz-bank";
import {
  QUIZ_LEAF_CATEGORIES,
  QUIZ_PARENT_CATEGORIES,
  QUIZ_CATEGORY_FALLBACKS,
} from "@/data/quiz-bank/categories";
import { ALL_QUESTIONS, GAME_CATEGORIES, pickQuestion } from "@/data/islamicQuizData";
import { buildPublishedLocalPools } from "@/data/quiz-bank/playable-pools";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../");
const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readMaj = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== مستندات الجرد ===");
assert.ok(
  existsSync(resolve(repoRoot, "docs/games/SIN_JEEM_ROOT_CAUSE_AND_CONTENT_AUDIT.md")),
  "مستند الجذر موجود",
);
assert.ok(
  existsSync(resolve(repoRoot, "docs/games/SIN_JEEM_QUESTION_BANK_AUDIT.md")),
  "مستند تدقيق البنك موجود",
);
const audit = readRepo("docs/games/SIN_JEEM_ROOT_CAUSE_AND_CONTENT_AUDIT.md");
assert.match(audit, /IslamicQuizGame\.tsx/);
assert.match(audit, /\/quiz/);
assert.match(audit, /\*\*490\*\*/);
assert.match(audit, /getPublishedQuestionCount\(\).*?\*\*0\*\*|منشور محلي.*?0/s);
assert.match(audit, /pickQuestion\("tafsir"/);

console.log("=== أعداد حية ===");
const bank = buildFullQuizBank();
assert.equal(bank.length, 490, `bank.length=${bank.length}`);
assert.equal(getPublishedQuestionCount(), 0);
assert.ok(bank.every((q) => q.publicationStatus === "DRAFT"));
assert.ok(bank.every((q) => !q.sourceTitle && !q.sourceReference));
assert.equal(QUIZ_LEAF_CATEGORIES.length, 30);
assert.equal(QUIZ_PARENT_CATEGORIES.length, 7);
assert.equal(GAME_CATEGORIES.length, 30);
assert.equal(GAME_CATEGORIES.length, QUIZ_LEAF_CATEGORIES.length);

let legacyRaw = 0;
for (const pools of Object.values(ALL_QUESTIONS)) {
  legacyRaw +=
    (pools[200]?.length ?? 0) + (pools[400]?.length ?? 0) + (pools[600]?.length ?? 0);
}
assert.equal(legacyRaw, 490, `legacyRaw=${legacyRaw}`);

const emptyLeaves = QUIZ_LEAF_CATEGORIES.filter((c) => {
  const p = ALL_QUESTIONS[c.id];
  const n =
    (p?.[200]?.length ?? 0) + (p?.[400]?.length ?? 0) + (p?.[600]?.length ?? 0);
  return n === 0;
});
assert.equal(emptyLeaves.length, 19, `emptyLeaves=${emptyLeaves.length}`);
assert.ok(Object.keys(QUIZ_CATEGORY_FALLBACKS).length >= 20);

console.log("=== عزل الفئة مكسور عبر fallback (إعادة إنتاج) ===");
const fromTafsir = pickQuestion("tafsir", 200, new Set(), ALL_QUESTIONS);
assert.ok(fromTafsir, "tafsir يسحب من fallback");
assert.equal(fromTafsir!.id.startsWith("q"), true, "سؤال قرآن تحت فئة تفسير");
const fromSalah = pickQuestion("fiqh_salah", 200, new Set(), ALL_QUESTIONS);
assert.ok(fromSalah, "fiqh_salah يسحب من fiqh");
assert.match(fromSalah!.id, /^f/, "سؤال فقه عام تحت فقه الصلاة");

const publishedPools = buildPublishedLocalPools();
const publishedAny = Object.values(publishedPools).some(
  (p) => p[200].length + p[400].length + p[600].length > 0,
);
assert.equal(publishedAny, false, "برك منشورة محلية فارغة");

console.log("=== مسارات ومكوّنات ===");
const routes = readMaj("src/AppRoutes.tsx");
assert.match(routes, /path="\/quiz"/);
assert.match(routes, /path="\/qa".*Redirect to="\/quiz"/s);
const page = readMaj("src/pages/account/QuizPage.tsx");
assert.match(page, /IslamicQuizGame/);
const game = readMaj("src/components/quiz-game/IslamicQuizGame.tsx");
assert.match(game, /1 لاعب/);
assert.match(game, /اسمك \(اختياري\)/);
assert.match(game, /selected\.length\} · \{GAME_CATEGORIES\.length\}/);
assert.match(game, /buildPublishedLocalPools/);
assert.match(game, /Math\.random/);

console.log("sin-jeem-pr0-audit-gate.test.ts: ok");
