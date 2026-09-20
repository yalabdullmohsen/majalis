/**
 * بوابة قبول: تحدي الأسئلة — إعادة بناء قسم سين جيم.
 * تشغيل: node --import tsx src/lib/__tests__/quiz-challenge-rebuild-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GAME_CATEGORIES } from "@/data/islamicQuizData";
import { QUIZ_CATEGORY_DEFS, QUIZ_PLAY_MODES } from "@/data/quiz-categories";
import { ROUTE_QUOTE } from "@/config/section-template";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/pages/account/QuizPage.tsx");
const game = read("src/components/quiz-game/IslamicQuizGame.tsx");
const css = read("src/styles/components/islamic-quiz-game.css");
const cats = read("src/data/quiz-categories.ts");

assert.equal(ROUTE_QUOTE["/quiz"], undefined, "لا بطاقة وقل رب زدني علماً على /quiz");
assert.doesNotMatch(page, /زدني علماً|زِدْنِي عِلْمًا/, "صفحة التحدي بلا آية زدني علماً");
assert.match(page, /تحدي الأسئلة/, "عنوان تحدي الأسئلة");
assert.match(page, /عشرات الفئات/, "وصف الهيرو");
assert.match(game, /تحدي الأسئلة/, "الهيرو داخل اللعبة");
assert.match(game, /تحدي سريع/, "وضع تحدي سريع");
assert.match(game, /تحدي يومي/, "وضع تحدي يومي");
assert.match(game, /عشوائي/, "وضع عشوائي");
assert.match(game, /فردي/, "وضع فردي");
assert.doesNotMatch(game, /prev\.length < 6/, "لا حد أقصى 6 فئات");
assert.match(game, /qzg-cats-grid--dynamic/, "شبكة فئات ديناميكية");
assert.match(game, /kind === "mcq"|kind === "true_false"/, "أنواع اختيار");
assert.match(game, /fill_blank|order|match/, "أنواع إضافية");

assert.ok(QUIZ_CATEGORY_DEFS.length >= 20, `عشرات الفئات (≥20) — الفعلي ${QUIZ_CATEGORY_DEFS.length}`);
assert.equal(GAME_CATEGORIES.length, QUIZ_CATEGORY_DEFS.length, "GAME_CATEGORIES يطابق السجل");
for (const name of ["النحو", "البلاغة", "التفسير", "التوحيد", "المعجم الشرعي"]) {
  assert.ok(
    QUIZ_CATEGORY_DEFS.some((c) => c.name === name),
    `الفئة موجودة: ${name}`,
  );
}
assert.equal(QUIZ_PLAY_MODES.length, 4, "أربعة أوضاع لعب أساسية");
assert.match(cats, /export const QUIZ_CATEGORY_DEFS/, "سجل فئات قابل للتوسعة");
assert.match(css, /qzg-play-modes/, "أنماط أوضاع اللعب");
assert.match(css, /qzg-cats-grid--dynamic/, "شبكة CSS ديناميكية");
assert.match(css, /data-theme="dark".*qzg-play-mode|html\.dark \.qzg-play-mode/s, "دعم الوضع الليلي");
assert.match(css, /min-height:\s*4\.25rem/, "حجز ارتفاع بطاقة الفئة — CLS");

console.log("quiz-challenge-rebuild-gate.test.ts: ok");
