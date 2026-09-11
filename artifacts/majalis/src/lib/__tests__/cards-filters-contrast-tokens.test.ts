/**
 * بوابة تباين ثابتة لبطاقات الإعجاز وفلاتر الدروس (بدون Playwright).
 * تكمل ASSERTIONS في verify-color-contrast-gate.mjs.
 * Run: node --import tsx src/lib/__tests__/cards-filters-contrast-tokens.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const miracles = readFileSync(resolve(root, "src/styles/pages/miracles.css"), "utf8");
const lessons = readFileSync(resolve(root, "src/styles/pages/lessons.css"), "utf8");
const gate = readFileSync(resolve(root, "scripts/verify-color-contrast-gate.mjs"), "utf8");

assert.match(miracles, /\.mk-card__title/);
assert.match(miracles, /\.mk-lane-card__title/);
assert.match(miracles, /\.mk-lane-card__cta/);
assert.match(miracles, /html\.dark \.mk-card__title/);
assert.match(miracles, /html\.dark \.mk-pill--topic/);
assert.doesNotMatch(
  miracles,
  /html\.dark \.mk-card__title[^{]*\{[^}]*color:\s*#12382e/s,
  "عنوان البطاقة الليلي ليس أخضر عميق على خلفية داكنة",
);

assert.match(lessons, /\.filter-chips__chip\.is-active/);
// نص فاتح على رقاقة/زر نشط — هكس أو رمز أبيض ثابت الثيم
assert.match(
  lessons,
  /color:\s*(?:#fff(?:fff)?|var\(--mj-(?:white|on-brand)(?:,\s*#ffffff)?\))\s*!important/,
);
assert.match(lessons, /\.lesson-unified-card--today/);

assert.match(gate, /route:\s*"\/miracles"/);
assert.match(gate, /\.hub-card__title/);
assert.match(gate, /\.hub-card__desc/);
assert.match(gate, /\.hub-card__go/);
assert.match(gate, /\.filter-chips__chip/);
assert.match(gate, /\.lesson-unified-card__title/);

// /cards: عنوان الصفحة الثابت — لا .sq-title (يختفي إن خلت أسئلة الـquiz)
assert.match(gate, /route:\s*"\/cards"/);
assert.match(gate, /\.cards-page-title/);
assert.doesNotMatch(
  gate,
  /route:\s*"\/cards"[^}]*selector:\s*"\.sq-title"/s,
  "/cards لا يعتمد محدّد .sq-title الشرطي",
);

const cardsPage = readFileSync(resolve(root, "src/views/CardsPage.tsx"), "utf8");
assert.match(cardsPage, /className="cards-page-title"/);
assert.match(cardsPage, /sectionId="akhlaq"/);

const cardsCss = readFileSync(resolve(root, "src/styles/pages/cards.css"), "utf8");
assert.match(cardsCss, /\.cards-page-title/);
assert.match(cardsCss, /CONTRAST GATE/);

console.log("cards-filters-contrast-tokens: ok");
