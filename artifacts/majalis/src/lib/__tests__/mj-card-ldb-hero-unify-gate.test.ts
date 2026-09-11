/**
 * بوابة: Card المشتركة + ldb-hero على soft parchment (بلا هيرو أخضر ممتد).
 * node --import tsx src/lib/__tests__/mj-card-ldb-hero-unify-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const mj = readFileSync(resolve(root, "src/components/ui/mj.tsx"), "utf8");
assert.match(mj, /function Card[\s\S]*?soft-card soft-card--on-light/, "Card الأساسي soft-card");

const shell = readFileSync(resolve(root, "src/styles/components/modern-section-shell.css"), "utf8");
assert.match(shell, /\.ldb-hero\s*[,{]/, "ldb-hero ضمن سطح soft hero");
assert.match(shell, /--mss-section-hero-bg/, "توكن parchment موجود");

const ldb = readFileSync(resolve(root, "src/styles/pages/learning-path-dashboard.css"), "utf8");
assert.doesNotMatch(
  ldb,
  /\.ldb-hero\s*\{[^}]*linear-gradient/,
  "ldb-hero بلا تدرج أخضر ممتد في learning-path-dashboard",
);

const quiz = readFileSync(resolve(root, "src/components/quiz-game/DailyChallengeQuiz.tsx"), "utf8");
assert.match(quiz, /soft-card soft-card--on-light/, "DailyChallengeQuiz soft-card");
assert.doesNotMatch(quiz, /\bmj-card\b/, "DailyChallengeQuiz بلا mj-card عاري");

const home = readFileSync(resolve(root, "src/pages/account/ui/HomeView.tsx"), "utf8");
assert.match(
  home,
  /home-daily-wird__card soft-card soft-card--on-light/,
  "هيكل الورود اليومي soft-card",
);

console.log("mj-card-ldb-hero-unify-gate.test.ts: ok");
