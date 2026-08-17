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
const shared = readFileSync(resolve(root, "src/components/sections/SectionCardShared.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/components/sections/section-cards.css"), "utf8");
const tokens = readFileSync(resolve(root, "src/styles/tokens.css"), "utf8");
const bottom = readFileSync(resolve(root, "src/components/BottomNavBar.tsx"), "utf8");

assert.match(hub, /SectionLobby/);
assert.match(featured, /card--featured/);
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
assert.match(shared, /card__label/);
assert.match(shared, /card__subtitle/);
assert.doesNotMatch(shared, /\{section\.label\}\s*\{section\.subtitle\}/);
assert.doesNotMatch(bottom, /MoreBottomSheet/);
assert.doesNotMatch(bottom, /المزيد/);

assert.match(css, /min-height:\s*96px/);
assert.match(css, /max-height:\s*112px/);
assert.match(css, /padding:\s*14px/);
assert.match(css, /-webkit-line-clamp:\s*1/);
assert.match(css, /@media \(hover:\s*hover\)/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.doesNotMatch(css, /^\.card:hover/m);
assert.doesNotMatch(css, /^\.card--featured:hover/m);
assert.match(card, /useSectionCardPress/);
assert.match(featured, /useSectionCardPress/);
assert.match(shared, /إضافة إلى المحفوظات/);
assert.match(shared, /مشاركة/);

console.log("more-hub-tile-colors.test.ts: ok");
