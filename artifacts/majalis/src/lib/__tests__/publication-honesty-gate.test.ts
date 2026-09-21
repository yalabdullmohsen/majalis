/**
 * Wave 4 — صدق النشر للعامة:
 * لا enums · لا فلاتر/مشاركة/تحدٍ على قسم فارغ · لا ادّعاء اكتمال بلا منشور.
 * تشغيل: node --import tsx src/lib/__tests__/publication-honesty-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { countPublishedIslamicSectsFromMeta } from "@/lib/islamic-sects";
import { getPublishedQuestionCount } from "@/data/quiz-bank";
import { EMPTY } from "@/lib/ui-copy";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const listSrc = read("src/views/IslamicSectsPage.tsx");
const detailSrc = read("src/views/IslamicSectsDetailPage.tsx");
const quizGame = read("src/components/quiz-game/IslamicQuizGame.tsx");
const quizBankGate = read("src/lib/__tests__/quiz-bank-review-gate.test.ts");

assert.equal(countPublishedIslamicSectsFromMeta(), 0, "الفرق: المنشور العام = 0");
assert.equal(getPublishedQuestionCount(), 0, "بنك الأسئلة المحلي المنشور = 0");

assert.ok(EMPTY.sectionPreparing.length > 10);
assert.ok(EMPTY.recordNotPublic.length > 10);
assert.doesNotMatch(EMPTY.sectionPreparing, /PUBLISHED|DRAFT|REVIEW_REQUIRED/);
assert.doesNotMatch(EMPTY.recordNotPublic, /PUBLISHED|DRAFT|REVIEW_REQUIRED/);

assert.match(listSrc, /hasPublished/);
assert.match(listSrc, /EMPTY\.sectionPreparing/);
assert.doesNotMatch(listSrc, /0 سجل منشور/);
assert.doesNotMatch(listSrc, /<code>PUBLISHED<\/code>/);
assert.doesNotMatch(listSrc, /طابور المراجعة/);
assert.match(
  listSrc,
  /!hasPublished[\s\S]*?sect-hub__empty[\s\S]*?:[\s\S]*?SectionQuiz/,
  "التحدي والمشاركة داخل فرع hasPublished فقط",
);

assert.match(detailSrc, /EMPTY\.recordNotPublic/);
assert.doesNotMatch(detailSrc, /حالة العقد/);
assert.doesNotMatch(detailSrc, /حتى حالة PUBLISHED/);
assert.doesNotMatch(detailSrc, /حالة المراجعة/);

assert.doesNotMatch(quizGame, /إلا PUBLISHED/);
assert.match(quizGame, /buildPublishedLocalPools/);
assert.match(quizBankGate, /getPublishedQuestionCount\(\),\s*0/);

const contract = readFileSync(
  resolve(root, "../../docs/content-quality/PUBLICATION_CONTRACT.md"),
  "utf8",
);
assert.match(contract, /PUBLISHED/);
assert.match(contract, /لا يظهر للعامة إلا/);
assert.match(contract, /لا Enums للمستخدم/);

console.log("publication-honesty-gate.test.ts: ok");
