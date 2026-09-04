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
assert.match(miracles, /\.mk-chip\.is-active/);
assert.match(miracles, /html\.dark \.mk-card__title/);
assert.match(miracles, /html\.dark \.mk-chip/);
assert.match(miracles, /html\.dark \.mk-pill--topic/);
assert.doesNotMatch(
  miracles,
  /html\.dark \.mk-card__title[^{]*\{[^}]*color:\s*#12382e/s,
  "عنوان البطاقة الليلي ليس أخضر عميق على خلفية داكنة",
);

assert.match(lessons, /\.filter-chips__chip\.is-active/);
assert.match(lessons, /color:\s*#fff\s*!important/);
assert.match(lessons, /\.lesson-unified-card--today/);

assert.match(gate, /route:\s*"\/miracles"/);
assert.match(gate, /\.mk-chip\.is-active/);
assert.match(gate, /\.filter-chips__chip/);
assert.match(gate, /\.lesson-unified-card__title/);

console.log("cards-filters-contrast-tokens: ok");
