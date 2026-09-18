/**
 * Wave 29 — توحيد فراغات البحث والتعلّم والاختبار والباحث عبر EMPTY.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave29-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const gsm = read("src/components/GlobalSearchModal.tsx");
assert.match(gsm, /EMPTY\.search/);
assert.match(gsm, /EMPTY\.searchShort/);
assert.match(gsm, /ACTION\.clearSearch/);
assert.doesNotMatch(gsm, /لا توجد نتائج في هذا القسم/);
assert.doesNotMatch(gsm, /لا نتائج لـ/);

const myl = read("src/pages/lessons/ui/MyLearningView.tsx");
assert.match(myl, /EMPTY\.bookmarks/);
assert.doesNotMatch(myl, /مكتبتك فارغة حتى الآن/);

const quiz = read("src/components/quiz-game/DailyChallengeQuiz.tsx");
assert.match(quiz, /EMPTY\.data/);
assert.doesNotMatch(quiz, /لا توجد أسئلة في هذا المستوى/);

const rag = read("src/components/rag/ResearchAnswer.tsx");
assert.match(rag, /EMPTY\.searchShort/);
assert.doesNotMatch(rag, /لا توجد نتائج في هذا التصنيف/);

const circles = read("src/pages/quran/ui/QuranCirclesView.tsx");
assert.match(circles, /EMPTY\.search/);
assert.match(circles, /EMPTY\.searchShort/);
assert.doesNotMatch(circles, /لا توجد حلقات مطابقة لهذا الفلتر/);

console.log("content-quality-wave29-gate.test.ts: ok");
