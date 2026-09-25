/**
 * بوابة عقد ألوان قصص الأنبياء (PR-2): Semantic Tokens + تباين بطاقات المصحف.
 * Run: node --import tsx src/lib/__tests__/prophets-color-contract-gate.test.ts
 * Script: pnpm --filter @workspace/majalis run test:prophets-color-contract
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const tokensPath = "src/styles/prophets-semantic-tokens.css";
assert.ok(existsSync(resolve(majalisRoot, tokensPath)), "ملف prophets-semantic-tokens.css موجود");

const tokens = read(tokensPath);
const css = read("src/styles/pages/prophet-stories.css");
const view = read("src/views/ProphetStoriesPage.tsx");

const requiredTokens = [
  "--prophets-bg",
  "--prophets-surface-1",
  "--prophets-surface-2",
  "--prophets-surface-3",
  "--prophets-surface-selected",
  "--prophets-border-subtle",
  "--prophets-border-strong",
  "--prophets-text-primary",
  "--prophets-text-secondary",
  "--prophets-text-muted",
  "--prophets-text-on-accent",
  "--prophets-accent",
  "--prophets-accent-hover",
  "--prophets-accent-soft",
  "--prophets-gold",
  "--prophets-focus-ring",
  "--prophets-overlay",
  "--prophets-error",
  "--prophets-success",
] as const;

for (const token of requiredTokens) {
  assert.match(tokens, new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`), `رمز ${token}`);
}

assert.match(tokens, /html\.dark[\s\S]*?--prophets-text-primary\s*:/);
assert.match(tokens, /html\.dark[\s\S]*?--prophets-surface-2\s*:/);
assert.doesNotMatch(tokens, /#[0-9a-fA-F]{3,8}.*blue|navy|#0[Bb]1[Aa]2[Ee]/);

assert.match(view, /prophets-semantic-tokens\.css/);
assert.match(view, /prophet-stories\.css/);
const tokIdx = view.indexOf("prophets-semantic-tokens.css");
const pageIdx = view.indexOf("prophet-stories.css");
assert.ok(tokIdx >= 0 && pageIdx > tokIdx, "tokens قبل prophet-stories.css");

/* بطاقات مواضع المصحف — لا خلفية داكنة افتراضية + inherit */
assert.doesNotMatch(
  css,
  /\.prophet-mushaf-mention-card\s*\{[^}]*#1a2e24/s,
  "لا fallback #1a2e24 على بطاقة المصحف",
);
assert.doesNotMatch(
  css,
  /\.prophet-mushaf-mention-card\s*\{[^}]*color:\s*inherit/s,
  "لا color:inherit على بطاقة المصحف",
);
assert.match(
  css,
  /\.prophet-mushaf-mention-card\s*\{[^}]*background:\s*var\(--prophets-surface-2/s,
);
assert.match(
  css,
  /\.prophet-mushaf-mention-card\s*\{[^}]*color:\s*var\(--prophets-text-primary/s,
);
assert.match(
  css,
  /\.prophet-mushaf-mention-card__title\s*\{[^}]*color:\s*var\(--prophets-text-primary/s,
);
assert.match(
  css,
  /\.prophet-mushaf-mention-card__note\s*\{[^}]*color:\s*var\(--prophets-text-secondary/s,
);
assert.match(
  css,
  /\.prophet-mushaf-mention-card__cta\s*\{[^}]*color:\s*var\(--prophets-accent\)/s,
);
assert.match(
  css,
  /html\.dark \.prophet-mushaf-mention-card[\s\S]{0,120}?background:\s*var\(--prophets-surface-2\)/s,
);
assert.match(
  css,
  /html\.dark \.prophet-mushaf-mention-card[\s\S]{0,160}?color:\s*var\(--prophets-text-primary\)/s,
);

/* لا كحلي في نطاق الأنبياء */
assert.equal((css.match(/#0[Bb]1[Aa]2[Ee]/g) ?? []).length, 0, "لا كحلي في prophet-stories.css");
assert.equal((tokens.match(/#0[Bb]1[Aa]2[Ee]/g) ?? []).length, 0, "لا كحلي في tokens");

console.log("prophets-color-contract-gate: ok");
