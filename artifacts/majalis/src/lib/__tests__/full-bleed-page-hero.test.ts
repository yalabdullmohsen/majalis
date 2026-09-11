/**
 * بوابة: هيرو الأقسام بطاقة داخل الهامش — بلا شريط أخضر ممتد بعرض الشاشة.
 * (كانت بوابة full-bleed؛ حُوِّلت مع توحيد الهوية إلى بطاقة سطح.)
 * node --import tsx src/lib/__tests__/full-bleed-page-hero.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const finalCss = read("src/styles/final-release.css");
assert.doesNotMatch(
  finalCss,
  /\.app-main:has\(\.page-hero-mj--bleed\)/,
  "لا تُفرغ حواف app-main لهيرو الأقسام (لم يعد شريطًا ممتدًا)",
);
assert.match(
  finalCss,
  /\.page-shell:has\(\.page-hero-mj--bleed:not\(\.home-page-hero\)\)/,
  "غلاف الصفحة يضم هيرو الأقسام كبطاقة",
);
assert.match(finalCss, /#root,\s*\n\.app-shell[\s\S]*?overflow-x:\s*clip/);

const heroCss = read("src/styles/components/page-hero.css");
assert.match(heroCss, /\.page-hero-mj--bleed:not\(\.home-page-hero\)\s*\{/);
assert.doesNotMatch(
  heroCss,
  /margin-inline:\s*calc\(\s*-1\s*\*/,
  "ممنوع هامش سالب على هيرو الأقسام",
);
assert.match(heroCss, /max-width:\s*min\(56rem/);
assert.match(heroCss, /background-image:\s*none/);
assert.match(heroCss, /border-inline-start:\s*4px\s+solid/);

const pageHero = read("src/components/ui/PageHero.tsx");
assert.match(pageHero, /fullBleed/);
assert.match(pageHero, /page-hero-mj--bleed/);

console.log("full-bleed-page-hero.test.ts: ok");
