/**
 * بوابة PR-3: Hero + Quick Facts + Tabs في مسار الإنتاج.
 * Run: node --import tsx src/lib/__tests__/prophets-hero-facts-tabs-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const hero = "src/components/prophets/ProphetIdentityHero.tsx";
const facts = "src/components/prophets/ProphetQuickFacts.tsx";
const tabs = "src/components/prophets/ProphetStoryTabs.tsx";
assert.ok(existsSync(resolve(majalisRoot, hero)));
assert.ok(existsSync(resolve(majalisRoot, facts)));
assert.ok(existsSync(resolve(majalisRoot, tabs)));

const view = read("src/views/ProphetStoriesPage.tsx");
const css = read("src/styles/pages/prophet-stories.css");
const heroSrc = read(hero);
const factsSrc = read(facts);
const tabsSrc = read(tabs);

assert.match(view, /ProphetIdentityHero/);
assert.match(view, /ProphetQuickFacts/);
assert.match(view, /ProphetStoryTabs/);
assert.match(view, /data-component="ProphetIdentityHero"|ProphetIdentityHero/);
assert.doesNotMatch(view, /prophet-detail-lux__hero-star/);
assert.doesNotMatch(view, /prophet-detail-lux__keys-hint/);

assert.match(heroSrc, /prophet-identity-hero/);
assert.match(heroSrc, /arabicName/);
assert.match(heroSrc, /pbuhText|صلوات الله وسلامه عليه/);
assert.match(factsSrc, /ProphetTopicCard/);
assert.match(factsSrc, /prophet-quick-facts/);
assert.match(tabsSrc, /role="tablist"/);
assert.match(tabsSrc, /aria-selected/);
assert.match(tabsSrc, /prophet-story-tabs__marker/);

assert.match(view, /label:\s*"القصة"/);
assert.match(view, /label:\s*"نبذة"/);
assert.match(view, /label:\s*"مواضع القرآن"/);
assert.match(view, /label:\s*"المعجزات"/);
assert.match(view, /label:\s*"الصفات"/);
assert.match(view, /label:\s*"الدروس والعبر"/);
assert.match(view, /label:\s*"المصادر"/);
assert.doesNotMatch(view, /label:\s*"السور"/);

assert.match(css, /\.prophet-identity-hero\s*\{/);
assert.match(css, /\.prophet-identity-hero\s*\{[^}]*background-color:\s*var\(--ps-emerald/s);
assert.match(css, /\.prophet-identity-hero__name\s*\{[^}]*color:\s*var\(--prophets-text-on-accent/s);
assert.match(
  css,
  /\.prophet-detail-lux h1\.prophet-identity-hero__name\s*\{[^}]*color:\s*var\(--ps-on-emerald/s,
);
assert.match(css, /\.prophet-quick-facts\s*,|\.prophet-facts-grid\s*,\s*\.prophet-quick-facts/);
assert.match(css, /\.prophet-story-tabs__btn\s*,|\.prophet-story-tabs__btn\s*\{/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /\.prophet-story-tabs__marker\s*\{/);
assert.equal((css.match(/#0[Bb]1[Aa]2[Ee]/g) ?? []).length, 0);

const contrastGate = read("scripts/verify-color-contrast-gate.mjs");
assert.match(contrastGate, /\.prophet-identity-hero__name/);
assert.doesNotMatch(contrastGate, /prophet-detail-lux__name/);

console.log("prophets-hero-facts-tabs-gate: ok");
