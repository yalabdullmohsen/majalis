/**
 * بوابة: نسبة أسئلة «اختبر معلوماتك» للأقسام.
 * تشغيل: node --import tsx src/lib/__tests__/quiz-content-affinity.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getQuestionsFor,
  resolveQuizSectionId,
  TAGGED_QUIZ_POOL,
  quizAffinityStats,
} from "../quiz-content-affinity.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

// التاريخ الإسلامي: لا أسئلة فقه
const historyQs = getQuestionsFor({ sectionId: "islamic-history", count: 20 });
assert.ok(historyQs.length > 0, "islamic-history له أسئلة");
assert.ok(
  historyQs.every((q) => q.sectionId === "islamic-history"),
  "أسئلة التاريخ لا تخلط فقهاً",
);
assert.ok(
  !historyQs.some((q) => q.id.startsWith("f")),
  "لا أسئلة fiqh (f*) في التاريخ",
);

// الفقه: أسئلة فقه فقط
const fiqhQs = getQuestionsFor({ sectionId: "fiqh", count: 10 });
assert.ok(fiqhQs.every((q) => q.sectionId === "fiqh"));

// قسم بلا أسئلة → مجموعة فارغة
assert.deepEqual(getQuestionsFor({ sectionId: "lessons" }), []);
assert.deepEqual(getQuestionsFor({ sectionId: "flashcards" }), []);

// resolve من route
assert.equal(resolveQuizSectionId({ route: "/tarikh-islami" }), "islamic-history");
assert.equal(resolveQuizSectionId({ sectionId: "topics" }), undefined);

const stats = quizAffinityStats();
assert.equal(stats.orphans, 0);
assert.equal(stats.tagged, TAGGED_QUIZ_POOL.length);

// TopicQuiz يخفى البطاقة — لا fallback
const topicQuiz = readFileSync(resolve(root, "src/components/ui/TopicQuiz.tsx"), "utf8");
assert.match(topicQuiz, /if \(questions\.length === 0\) return null/);
assert.doesNotMatch(topicQuiz, /categoryId/);

// SectionQuiz → re-export
const sectionQuiz = readFileSync(resolve(root, "src/components/ui/SectionQuiz.tsx"), "utf8");
assert.match(sectionQuiz, /TopicQuiz/);

// TarikhIslamiPage: sectionId واحد
const tarikh = readFileSync(resolve(root, "src/views/TarikhIslamiPage.tsx"), "utf8");
assert.match(tarikh, /sectionId="islamic-history"/);
assert.doesNotMatch(tarikh, /categoryId/);
assert.doesNotMatch(tarikh, /fiqh/);

console.log("quiz-content-affinity.test.ts: ok");
