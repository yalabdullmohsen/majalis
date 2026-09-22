/**
 * SUNNAH VISUAL IDENTITY RESET — PR-4 gate
 * Home Hero A + Quran Hub densify
 * Run: node --import tsx src/lib/__tests__/sunnah-identity-reset-pr4-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== home hero identity ===");
{
  const hero = read("src/components/home/HomeHeroLcp.tsx");
  assert.match(hero, /hw3--identity|hw3-chip--lead/);
  assert.match(hero, /hw3-primary/);
  assert.match(hero, /hw3-meta/);
  assert.match(hero, /sunnah-identity-home-hub\.css/);
  assert.match(hero, /تابع التعلم|ابدأ الآن/);
  assert.doesNotMatch(hero, /hw3-strip/);
  assert.doesNotMatch(hero, /mushaf-reader|qpc-v2|AdminV3/);
}

console.log("=== quran hub ===");
{
  const hub = read("src/pages/quran/ui/QuranHubView.tsx");
  assert.match(hub, /QuranOpenMushafCard/);
  assert.match(hub, /sunnah-identity-home-hub\.css/);
  assert.match(hub, /quran-hub-v2/);
  assert.doesNotMatch(hub, /MushafReader|VerifiedMushaf|qpc-v2/);
}

console.log("=== CSS densify ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/sunnah-identity-home-hub.css")));
  const css = read("src/styles/sunnah-identity-home-hub.css");
  assert.match(css, /Home Hero|home-page-hero|hw3-chip--lead/);
  assert.match(css, /Quran Hub|quran-open-mushaf/);
  assert.match(css, /min-height:\s*0/);
  assert.match(css, /line-clamp:\s*2/);
  assert.doesNotMatch(css, /!important/);
  assert.doesNotMatch(css, /mushaf-reader|qpc-v2/);
}

console.log("=== docs + package ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/SUNNAH_VISUAL_IDENTITY_RESET.md"), "utf8");
  assert.match(doc, /PR-4/);
  assert.match(doc, /Home|Quran Hub|هيرو|مركز القرآن/i);
  const pkg = read("package.json");
  assert.match(pkg, /test:sunnah-identity-reset-pr4/);
}

console.log("sunnah-identity-reset-pr4-gate.test.ts: ok");
