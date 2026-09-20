/**
 * بوابة Green Surface System — رموز جذرية + بطاقات بلا شريط جانبي زخرفي.
 * تشغيل: node --import tsx src/lib/__tests__/green-surface-system-gate.test.ts
 *
 * عقد 2026-09: إزالة border-inline-start: 3px الزخرفي من نظام البطاقات.
 * الشريط الدلالي (حالة حديث / إدارة) يبقى خارج هذا الملف.
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
const stripCleanup = read("src/styles/card-decorative-strip-cleanup.css");

assert.match(tokens, /--surface-feature:/, "token surface-feature");
assert.match(tokens, /--surface-knowledge:/, "token surface-knowledge");
assert.match(tokens, /--surface-islamic:/, "token surface-islamic");
assert.match(tokens, /--surface-highlighted:/, "token surface-highlighted");
assert.match(tokens, /--surfaceFeature:/, "alias surfaceFeature");
assert.match(tokens, /Dark Green Surface System/, "dark green tokens");

assert.match(green, /--surface-feature-accent:/, "accent token (عناوين/أيقونات)");
assert.match(green, /--surface-feature-border:/, "border token");
assert.doesNotMatch(green, /border-inline-start:\s*[34]px/, "لا شريط جانبي زخرفي على Green Surface");
assert.doesNotMatch(
  unify,
  /border-inline-start:\s*[34]px\s+solid/,
  "لا شريط جانبي زخرفي في card-unify",
);
assert.doesNotMatch(
  calm,
  /border-inline-start:\s*[34]px\s+solid/,
  "لا شريط جانبي زخرفي في calm-polish",
);
assert.doesNotMatch(
  info,
  /border-inline-start:\s*[34]px\s+solid/,
  "لا شريط جانبي زخرفي في InformationCard",
);
assert.match(green, /\.seerah-panel/, "seerah panels on green surface");
assert.match(green, /\.hub-card/, "hub cards on green surface");
assert.match(green, /html\.dark|data-theme="dark"/, "dark green system");

assert.match(main, /green-surface-system\.css/, "main imports green surface");
assert.match(main, /card-decorative-strip-cleanup\.css/, "main imports strip cleanup");
assert.match(main, /interaction-states\.css/, "main imports interaction-states");
assert.match(stripCleanup, /hadith-hub-card--sahih/, "يحفظ شريط حالة الحديث");
assert.match(stripCleanup, /cat-node|status.strip/i, "يحفظ شريط حالة الإدارة");

assert.match(calm, /--surface-feature/, "calm polish uses green surface");
assert.doesNotMatch(calm, /border-inline-start:\s*[34]px\s+solid\s+var\(--surface-feature-accent/, "calm بلا شريط accent");

assert.match(unify, /--surface-feature/, "card unify uses green surface");
assert.doesNotMatch(unify, /border-inline-start:\s*[34]px/, "unify بلا شريط زخرفي");
assert.match(hub, /--surface-feature/, "hub-card uses green surface tokens");
assert.doesNotMatch(
  hub,
  /\.hub-card\s*\{[^}]*linear-gradient\([\s\S]*?--mj-surface,\s*#fff/,
  "لا تدرج أبيض قديم في hub-card",
);

assert.match(info, /--surface-knowledge/, "InformationCard على عائلة خضراء");
assert.match(mss, /--mss-section-hero-bg:\s*var\(--surface-islamic/, "هيرو الأقسام من surface-islamic");

console.log("green-surface-system-gate.test.ts: ok");
