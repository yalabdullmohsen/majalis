/**
 * بوابة: هيرو الأقسام بطاقة داخل الهامش — بلا شريط أخضر ممتد ولا عمود جانبي (SVL PR-3).
 * node --import tsx src/lib/__tests__/full-bleed-page-hero.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const heroCss = read("src/styles/components/page-hero.css");
assert.match(heroCss, /\.page-hero-mj--bleed:not\(\.home-page-hero\)\s*\{/);
assert.doesNotMatch(
  heroCss,
  /margin-inline:\s*calc\(\s*-1\s*\*/,
  "ممنوع هامش سالب على هيرو الأقسام",
);
assert.match(heroCss, /max-width:\s*min\(56rem/);
assert.match(heroCss, /background-image:\s*none/);
assert.doesNotMatch(
  heroCss,
  /border-inline-start:\s*[34]px\s+solid/,
  "ممنوع عمود أخضر جانبي على هيرو الأقسام",
);
assert.match(heroCss, /border-inline-start-width:\s*1px/);
assert.match(heroCss, /--mss-hero-gradient|--mss-hero-from|--mss-section-hero-bg/);

const pageHero = read("src/components/ui/PageHero.tsx");
assert.match(pageHero, /fullBleed/);
assert.match(pageHero, /page-hero-mj--bleed/);
assert.match(pageHero, /HeaderOrnament|svl-header-ornament/);
assert.match(pageHero, /svl-page-header/);

console.log("full-bleed-page-hero.test.ts: ok");
