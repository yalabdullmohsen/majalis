/**
 * بوابة: بطل الصفحة ممتد edge-to-edge بلا هامش سالب / حشو مزدوج.
 * node --import tsx src/lib/__tests__/full-bleed-page-hero.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const finalCss = read("src/styles/final-release.css");
assert.match(finalCss, /\.app-main:has\(\.page-hero-mj--bleed\)/);
assert.match(finalCss, /\.page-shell:has\(\.page-hero-mj--bleed\)/);
assert.match(finalCss, /padding-inline:\s*0/);
assert.match(finalCss, /#root,\s*\n\.app-shell[\s\S]*?overflow-x:\s*clip/);

const heroCss = read("src/styles/components/page-hero.css");
assert.match(heroCss, /\.page-hero-mj--bleed\s*\{/);
assert.doesNotMatch(
  heroCss,
  /margin-inline:\s*calc\(\s*-1\s*\*/,
  "ممنوع هامش سالب على البطل الممتد",
);
assert.match(heroCss, /width:\s*100%/);
assert.match(heroCss, /max-width:\s*min\(64rem,\s*100%\)/);

const pageHero = read("src/components/ui/PageHero.tsx");
assert.match(pageHero, /fullBleed/);
assert.match(pageHero, /page-hero-mj--bleed/);

console.log("full-bleed-page-hero.test.ts: ok");
