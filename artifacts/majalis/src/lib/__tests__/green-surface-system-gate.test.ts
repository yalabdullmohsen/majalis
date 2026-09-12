/**
 * بوابة Green Surface System — رموز جذرية + لا بطاقات بيضاء قديمة في طبقات التوحيد.
 * تشغيل: node --import tsx src/lib/__tests__/green-surface-system-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const tokens = read("src/styles/design-tokens.css");
const green = read("src/styles/green-surface-system.css");
const main = read("src/main.tsx");
const calm = read("src/styles/sections-calm-polish.css");
const unify = read("src/styles/ssunnah-card-unify.css");
const hub = read("src/styles/components/hub-card.css");
const info = read("src/styles/components/information-card.css");
const mss = read("src/styles/components/modern-section-shell.css");

assert.match(tokens, /--surface-feature:/, "token surface-feature");
assert.match(tokens, /--surface-knowledge:/, "token surface-knowledge");
assert.match(tokens, /--surface-islamic:/, "token surface-islamic");
assert.match(tokens, /--surface-highlighted:/, "token surface-highlighted");
assert.match(tokens, /--surfaceFeature:/, "alias surfaceFeature");
assert.match(tokens, /Dark Green Surface System/, "dark green tokens");

assert.match(green, /--surface-feature-accent:/, "accent token");
assert.match(green, /--surface-feature-border:/, "border token");
assert.match(green, /border-inline-start:\s*3px\s+solid/, "accent side border");
assert.match(green, /\.seerah-panel/, "seerah panels on green surface");
assert.match(green, /\.hub-card/, "hub cards on green surface");
assert.match(green, /html\.dark|data-theme="dark"/, "dark green system");

assert.match(main, /green-surface-system\.css/, "main imports green surface");

assert.match(calm, /--surface-feature/, "calm polish uses green surface");

assert.match(unify, /--surface-feature/, "card unify uses green surface");
assert.match(hub, /--surface-feature/, "hub-card uses green surface tokens");
assert.doesNotMatch(
  hub,
  /\.hub-card\s*\{[^}]*linear-gradient\([\s\S]*?--mj-surface,\s*#fff/,
  "لا تدرج أبيض قديم في hub-card",
);

assert.match(info, /--surface-knowledge/, "InformationCard على عائلة خضراء");
assert.match(mss, /--mss-section-hero-bg:\s*var\(--surface-islamic/, "هيرو الأقسام من surface-islamic");

console.log("green-surface-system-gate.test.ts: ok");
