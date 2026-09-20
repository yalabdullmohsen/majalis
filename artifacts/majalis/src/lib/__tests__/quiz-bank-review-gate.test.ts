/**
 * بوابة بنك تحدي الأسئلة — مسار المراجعة والنشر.
 * تشغيل: node --import tsx src/lib/__tests__/quiz-bank-review-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  QUIZ_ALL_CATEGORIES,
  QUIZ_CATEGORY_DEFS,
  QUIZ_LEAF_CATEGORIES,
} from "@/data/quiz-bank/categories";
import {
  buildFullQuizBank,
  getPublishedQuestionCount,
  getPublishedQuizQuestions,
} from "@/data/quiz-bank";
import {
  canPublishQuestion,
  type QuizBankQuestion,
} from "@/data/quiz-bank/types";
import { assertNoUlamaCategory, assertPublishedInvariant } from "@/data/quiz-bank/publication";
import { ROUTE_QUOTE } from "@/config/section-template";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.equal(ROUTE_QUOTE["/quiz"], undefined, "لا بطاقة زدني علماً");

assertNoUlamaCategory([...QUIZ_ALL_CATEGORIES]);
assert.ok(
  !QUIZ_LEAF_CATEGORIES.some((c) => c.id === "ulama" || /علماء/.test(c.title)),
  "لا فئة علماء الإسلام",
);

assert.ok(QUIZ_LEAF_CATEGORIES.length >= 20, "فئات أوراق كافية");
assert.equal(QUIZ_CATEGORY_DEFS.length, QUIZ_LEAF_CATEGORIES.length);

for (const name of ["النحو", "البلاغة", "التفسير", "التوحيد", "المعجم الشرعي", "فقه الصلاة"]) {
  assert.ok(
    QUIZ_LEAF_CATEGORIES.some((c) => c.title === name),
    `فئة مطلوبة: ${name}`,
  );
}

const bank = buildFullQuizBank();
assert.ok(bank.length > 0, "البنك يحتوي مسودات legacy");
assert.ok(
  bank.every((q) => q.publicationStatus !== "PUBLISHED"),
  "لا سؤال legacy منشور تلقائيًا",
);
assert.equal(getPublishedQuestionCount(), 0, "العدد المنشور المحلي = 0 حتى المراجعة");
assert.equal(getPublishedQuizQuestions().length, 0);

assertPublishedInvariant(bank);

const forged: QuizBankQuestion = {
  ...bank[0]!,
  id: "forged_publish",
  publicationStatus: "PUBLISHED",
  factualReviewStatus: "PENDING",
  shariaReviewStatus: "PENDING",
  languageReviewStatus: "PENDING",
  licenseStatus: "UNKNOWN",
  sourceTitle: undefined,
  sourceReference: undefined,
};
assert.equal(canPublishQuestion(forged).ok, false, "منع نشر بلا مصدر ومراجعة");

const page = read("src/pages/account/QuizPage.tsx");
const home = read("src/components/home/HomeQuizCard.tsx");
const game = read("src/components/quiz-game/IslamicQuizGame.tsx");
assert.doesNotMatch(page, /مئات الأسئلة/, "بلا ادّعاء مئات في الصفحة");
assert.doesNotMatch(home, /مئات الأسئلة/, "بلا ادّعاء مئات في الرئيسية");
assert.doesNotMatch(game, /مئات الأسئلة/, "بلا ادّعاء مئات في اللعبة");
assert.match(page, /أسئلة متنوعة وموثقة/, "وصف المنتج المعتمد");
assert.match(game, /عدد الفئات في الجولة/, "اختيار عدد الفئات");
assert.match(game, /buildPublishedLocalPools/, "برك منشورة فقط محليًا");

const queue = readFileSync(
  resolve(root, "../../docs/content-quality/SCHOLAR_REVIEW_QUEUE.md"),
  "utf8",
);
assert.match(queue, /SRQ-QUIZ-BANK-001/, "طابور مراجعة بنك الأسئلة");

console.log("quiz-bank-review-gate.test.ts: ok");
