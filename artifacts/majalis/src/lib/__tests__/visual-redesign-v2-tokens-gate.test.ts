/**
 * Visual Redesign V2 — tokens + SunnahCard V2 gate (PR-1).
 * Run: node --import tsx src/lib/__tests__/visual-redesign-v2-tokens-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { V2_COLOR, V2_RADIUS, SS_COLOR } from "../ssunnah-theme.ts";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== theme SoT ivory + emerald + gold ===");
{
  const theme = read("src/app/styles/theme.css");
  assert.match(theme, /--surface-app:\s*#F7F3EB/i);
  assert.match(theme, /--sunnah-quran-gold:\s*#C9A82E/i);
  assert.match(theme, /--sunnah-emerald:/);
  assert.match(theme, /--sunnah-v2-radius-card:/);
  assert.match(theme, /--surface-app:\s*#0F1613/i);
}

console.log("=== V2 tokens file ===");
{
  const v2 = read("src/styles/visual-redesign-v2-tokens.css");
  assert.match(v2, /--v2-color-ivory:\s*#f9f8f4/i);
  assert.match(v2, /--v2-color-emerald/);
  assert.match(v2, /--v2-color-gold/);
  assert.match(v2, /--v2-color-night-bg/);
  assert.match(v2, /--v2-radius-card/);
  assert.match(v2, /--v2-duration-fast/);
  assert.match(v2, /data-v2-dashboard/);
  assert.match(v2, /prefers-reduced-motion/);
}

console.log("=== wired in main ===");
{
  const main = read("src/main.tsx");
  assert.match(main, /visual-redesign-v2-tokens\.css/);
}

console.log("=== SunnahCard V2 ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/components/design-system/SunnahCardV2.tsx")));
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/components/sunnah-card-v2.css")));
  const card = read("src/components/design-system/SunnahCardV2.tsx");
  const css = read("src/styles/components/sunnah-card-v2.css");
  assert.match(card, /variant\?:/);
  assert.match(card, /welcome/);
  assert.doesNotMatch(card, /#[0-9A-Fa-f]{3,8}/);
  assert.match(css, /\.sc2--welcome/);
  assert.doesNotMatch(css, /border-inline-start:\s*[34]px/);
  const idx = read("src/components/design-system/index.ts");
  assert.match(idx, /SunnahCardV2/);
}

console.log("=== TS aliases ===");
assert.equal(V2_COLOR.emerald, "var(--v2-color-emerald)");
assert.equal(V2_COLOR.gold, "var(--v2-color-gold)");
assert.equal(V2_RADIUS.card, "var(--v2-radius-card)");
assert.equal(SS_COLOR.quranGold, "var(--ss-color-quran-gold)");

console.log("=== docs ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /Premium Islamic Dashboard/);
  assert.match(doc, /Deep Emerald/);
  assert.match(doc, /SunnahCardV2/);
  assert.match(doc, /HomeQuickAccessV2/);
  assert.match(doc, /home-dashboard-v2\.css/);
}

console.log("=== PR-2 Dashboard Homepage ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-dashboard/);
  assert.match(app, /m2030-home--v2/);
  assert.ok(existsSync(resolve(majalisRoot, "src/components/home/HomeQuickAccessV2.tsx")));
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/home-dashboard-v2.css")));
  const below = read("src/pages/account/ui/HomeBelowFold.tsx");
  assert.match(below, /SunnahCardV2/);
  assert.match(below, /HomeQuickAccessV2/);
  assert.match(below, /استكمال الرحلة/);
  assert.doesNotMatch(below, /FeatureCard/);
  const brand = read("src/styles/components/home-brand-title.css");
  assert.match(brand, /data-v2-dashboard/);
  assert.match(brand, /--v2-color-emerald/);
  const homeView = read("src/pages/account/ui/HomeView.tsx");
  assert.match(homeView, /home-dashboard-v2\.css/);
}

console.log("=== package script ===");
{
  const pkg = read("package.json");
  assert.match(pkg, /test:visual-redesign-v2-tokens/);
}

console.log("visual-redesign-v2-tokens-gate.test.ts: ok");
