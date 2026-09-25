/**
 * Modern Islamic Editorial Design gate.
 * Run: node --import tsx src/lib/__tests__/modern-islamic-editorial-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const tokensPath = "src/styles/modern-islamic-editorial-tokens.css";
const applyPath = "src/styles/modern-islamic-editorial.css";

assert.ok(existsSync(resolve(majalisRoot, tokensPath)), "tokens CSS missing");
assert.ok(existsSync(resolve(majalisRoot, applyPath)), "apply CSS missing");

const tokens = read(tokensPath);
const apply = read(applyPath);
const main = read("src/main.tsx");
const mushafCss = read("src/features/mushaf-reader/mushaf-reader.css");

console.log("=== tokens present ===");
for (const name of [
  "--surface-paper",
  "--surface-card",
  "--surface-card-elevated",
  "--brand-olive",
  "--brand-gold",
  "--text-primary",
  "--text-secondary",
  "--text-muted",
]) {
  assert.match(tokens, new RegExp(name.replace(/-/g, "\\-")));
}

console.log("=== light ivory + olive (no neon blue brand) ===");
assert.match(tokens, /--surface-paper:\s*#f3eee3/i);
assert.match(tokens, /--brand-olive:\s*#3d5c45/i);
assert.doesNotMatch(tokens, /#4f46e5|#6366f1|#3b82f6|neon|glow\s*:/i);

console.log("=== dark mode overrides ===");
assert.match(tokens, /html\[data-theme="dark"\]/);
assert.match(tokens, /--surface-paper:\s*#121816/i);

console.log("=== main wiring order ===");
const tokIdx = main.indexOf("modern-islamic-editorial-tokens.css");
const applyIdx = main.indexOf("modern-islamic-editorial.css");
const sectionCardsIdx = main.indexOf("section-cards-theme.css");
assert.ok(tokIdx > sectionCardsIdx, "editorial tokens after section-cards-theme");
assert.ok(applyIdx > tokIdx, "editorial apply after tokens");

console.log("=== educational scopes only ===");
assert.match(apply, /\.prophets-lux-page/);
assert.match(apply, /\.lessons-page-v2/);
assert.match(apply, /\.search-page/);
assert.match(apply, /html\.pts-immersive/);
assert.match(apply, /\.cr-shell/);
assert.match(apply, /استثناء صريح|المصحف/);

console.log("=== mushaf untouched by editorial apply selectors ===");
assert.doesNotMatch(apply, /\.nm-root\s*\{[^}]*--surface-paper/s);
assert.doesNotMatch(mushafCss, /modern-islamic-editorial/);
assert.doesNotMatch(mushafCss, /--brand-olive/);

console.log("modern-islamic-editorial-gate.test.ts: ok");
