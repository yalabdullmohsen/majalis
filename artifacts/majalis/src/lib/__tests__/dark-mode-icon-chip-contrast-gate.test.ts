/**
 * بوابة تباين أيقونات/رقائق التصفية في الوضع الليلي.
 * node --import tsx src/lib/__tests__/dark-mode-icon-chip-contrast-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const quad = read("src/components/lobby/quick-actions-quad.css");
const lobby = read("src/components/lobby/section-lobby.css");
const harvest = read("src/styles/components/harvest-feed-panel.css");
const filters = read("src/styles/components/filters.css");
const cards = read("src/components/sections/section-cards.css");
const src = read("src/styles/components/source-item-card.css");

assert.match(quad, /html\.dark \.quick-quad__icon[\s\S]{0,220}#6ee7b7/);
assert.match(quad, /rgb\(28 58 48/);
assert.match(lobby, /html\.dark \.section-lobby__chip\.is-active[\s\S]{0,160}#059669/);
assert.match(lobby, /html\.dark \.section-lobby__chip\.is-active[\s\S]{0,200}#ffffff/);
assert.match(lobby, /#a7f3d0/);
assert.match(harvest, /harvest-panel__tabs button\.is-active[\s\S]{0,160}#059669/);
assert.match(filters, /mj-filter-chip\.is-active[\s\S]{0,160}#059669/);
assert.match(filters, /color:\s*#ffffff/);
assert.match(cards, /html\.dark \.card \.card__icon[\s\S]{0,160}#6ee7b7/);
assert.match(src, /src-card__badge[\s\S]{0,160}#6ee7b7/);

console.log("dark-mode-icon-chip-contrast-gate.test.ts: ok");
