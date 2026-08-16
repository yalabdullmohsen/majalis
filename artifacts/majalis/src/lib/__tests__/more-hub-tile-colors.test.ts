/**
 * بوابة ثابتة: شيت المزيد من السجل — بطاقات دلالية + تباين العلامة.
 * تشغيل: node --import tsx src/lib/__tests__/more-hub-tile-colors.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const sheet = readFileSync(resolve(root, "src/components/MoreBottomSheet.tsx"), "utf8");
const hub = readFileSync(resolve(root, "src/features/more/MoreHubFromRegistry.tsx"), "utf8");
const featured = readFileSync(
  resolve(root, "src/components/sections/FeaturedSectionCard.tsx"),
  "utf8",
);
const card = readFileSync(resolve(root, "src/components/sections/SectionCard.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/components/sections/section-cards.css"), "utf8");
const tokens = readFileSync(resolve(root, "src/styles/tokens.css"), "utf8");

assert.match(sheet, /MoreHubFromRegistry/);
assert.match(hub, /FeaturedSectionsGrid/);
assert.match(hub, /SectionsCardGrid/);
assert.match(hub, /SectionsRowList/);
assert.match(hub, /SECTION_GROUP_ORDER/);
assert.match(featured, /section-card--featured/);
assert.match(featured, /text-white/);
assert.match(css, /\.section-card--featured\s*\{/);
assert.match(css, /linear-gradient/);
assert.match(css, /border-radius:\s*16px/);
assert.doesNotMatch(card, /section-card--featured|linear-gradient/);
assert.match(tokens, /--on-brand:\s*#ffffff/);
assert.match(featured, /aria-label/);
assert.match(card, /aria-label/);
assert.match(card, /section-card__label/);
assert.match(card, /section-card__subtitle/);
assert.doesNotMatch(card, /\{section\.label\}\s*\{section\.subtitle\}/);

console.log("more-hub-tile-colors.test.ts: ok");
