/**
 * بوابة: لوحات الاختبار الإسلامي على soft-card.
 * node --import tsx src/lib/__tests__/quiz-soft-card-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const css = read("src/styles/components/islamic-quiz-game.css");
const tsx = read("src/components/quiz-game/IslamicQuizGame.tsx");
const bridge = read("src/styles/ssunnah-card-unify.css");

assert.match(css, /\.qzg-section-card[\s\S]{0,220}?--radius-card/, "qzg-section-card يستخدم --radius-card");
assert.doesNotMatch(
  css,
  /\.qzg-section-card\s*\{[\s\S]{0,160}?border-radius:\s*var\(--ds-radius-lg,\s*0\.625rem\)/,
  "لا radius لوحي 0.625rem على جذر البطاقة",
);
assert.match(tsx, /qzg-section-card soft-card soft-card--on-light/, "JSX يركّب soft-card");
assert.match(bridge, /\.qzg-section-card\.soft-card/, "جسر التوحيد يشمل الاختبار");

console.log("quiz-soft-card-gate.test.ts: ok");
