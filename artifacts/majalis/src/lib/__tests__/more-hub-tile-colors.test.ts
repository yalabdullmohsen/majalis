/**
 * بوابة ثابتة: شيت/صفحة الأقسام — بطاقات دلالية مربوطة اللون بالخلفية.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const hub = readFileSync(resolve(root, "src/features/more/MoreHubFromRegistry.tsx"), "utf8");
const featured = readFileSync(
  resolve(root, "src/components/sections/FeaturedSectionCard.tsx"),
  "utf8",
);
const card = readFileSync(resolve(root, "src/components/sections/SectionCard.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/components/sections/section-cards.css"), "utf8");
const tokens = readFileSync(resolve(root, "src/styles/tokens.css"), "utf8");
const bottom = readFileSync(resolve(root, "src/components/BottomNavBar.tsx"), "utf8");

assert.match(hub, /SectionLobby/);
assert.match(featured, /function HeroActionCard/);
assert.match(featured, /data-hero-action="1"/);
assert.match(css, /justify-items:\s*center/);
assert.match(css, /clamp\(20px,\s*5\.5vw,\s*28px\)/);
assert.match(css, /font-weight:\s*700/);
assert.doesNotMatch(css, /\.card--featured[\s\S]{0,400}text-align:\s*(left|right)/);
assert.doesNotMatch(hub, /card--featured/);
assert.doesNotMatch(hub, /FeaturedSectionsGrid/);
assert.doesNotMatch(featured, /text-white/);
assert.match(css, /\.card--featured\s*\{|button\.card--featured/);
assert.match(css, /background-color:\s*#1f7a5a/);
assert.match(css, /color:\s*#ffffff/);
assert.doesNotMatch(card, /card--featured|linear-gradient/);
assert.match(tokens, /--on-brand:\s*#ffffff/);
assert.match(featured, /aria-label/);
assert.match(card, /aria-label/);
assert.match(card, /card__label/);
assert.match(card, /card__subtitle/);
assert.doesNotMatch(card, /\{section\.label\}\s*\{section\.subtitle\}/);
assert.doesNotMatch(bottom, /MoreBottomSheet/);
assert.doesNotMatch(bottom, /المزيد/);

console.log("more-hub-tile-colors.test.ts: ok");
