/**
 * بوابة: بطاقات مطفية موحّدة — بلا لمعان/وهج زخرفي.
 * Run: node --import tsx src/lib/__tests__/card-matte-unify-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const main = read("src/main.tsx");
const matte = read("src/styles/card-matte-unify.css");
const soft = read("src/styles/soft-cards.css");
const sc2 = read("src/styles/components/sunnah-card-v2.css");
const hub = read("src/styles/components/hub-card.css");
const prophets = read("src/styles/pages/prophet-stories.css");

console.log("=== استيراد الطبقة ===");
assert.match(main, /card-matte-unify\.css/);
assert.match(matte, /\.home-card-glow/);
assert.match(matte, /\.prophet-lux-card__glow/);
assert.doesNotMatch(matte, /\[class\*="card"\]|\[class\$="-card"\]/);
assert.match(matte, /\.soft-card \[class\*="__glow"\]/);

console.log("=== soft-cards مطفي ===");
assert.match(soft, /--soft-card-grad:\s*none/);
assert.doesNotMatch(soft, /--soft-card-shadow:[\s\S]*?inset 0 1px 0 rgba\(255/);
assert.doesNotMatch(soft, /\.soft-card--accent[\s\S]*?inset 0 1px 0 rgba\(255/);

console.log("=== sc2 بلا highlight أبيض / وهج ذهبي ===");
assert.doesNotMatch(sc2, /0 1px 0 color-mix\(in srgb,\s*#fff/);
assert.doesNotMatch(sc2, /radial-gradient\(\s*120%\s*80%\s*at 100% 0%/);
assert.match(sc2, /\.sc2--welcome::after\s*\{[\s\S]*?content:\s*none/);

console.log("=== hub-card أيقونة بلا inset أبيض ===");
assert.doesNotMatch(
  hub,
  /\.hub-card__icon\s*\{[\s\S]*?inset 0 1px 0 rgba\(255,\s*255,\s*255/,
);

console.log("=== home-card-glow معطّل عبر طبقة matte ===");
assert.match(matte, /\.home-card-glow[\s\S]{0,400}display:\s*none/);

console.log("=== وهج بطاقات الأنبياء معطّل نهاريًا ===");
assert.match(
  prophets,
  /\.prophet-lux-card__glow\s*\{[\s\S]*?display:\s*none/,
);
assert.match(
  prophets,
  /\.prophet-lux-card:hover \.prophet-lux-card__glow[\s\S]{0,80}opacity:\s*0/,
);

console.log("card-matte-unify-gate.test.ts: ok");
