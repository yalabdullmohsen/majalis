/**
 * SUNNAH VISUAL IDENTITY RESET — PR-3 gate
 * Cards + content rows vocabulary
 * Run: node --import tsx src/lib/__tests__/sunnah-identity-reset-pr3-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== components ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/components/design-system/IdentitySurfaces.tsx")));
  const src = read("src/components/design-system/IdentitySurfaces.tsx");
  assert.match(src, /export function CompactNavigationCard/);
  assert.match(src, /export function ContentRow/);
  assert.match(src, /export function DetailSection/);
  assert.match(src, /export function QuoteSurface/);
  assert.match(src, /export function StatusNotice/);
  assert.match(src, /data-identity-card/);
  assert.doesNotMatch(src, /mushaf-reader|AdminV3|qpc-v2/);
}

console.log("=== exports ===");
{
  const idx = read("src/components/design-system/index.ts");
  assert.match(idx, /CompactNavigationCard/);
  assert.match(idx, /ContentRow/);
  assert.match(idx, /DetailSection/);
  assert.match(idx, /QuoteSurface/);
  assert.match(idx, /StatusNotice/);
  assert.match(idx, /FeatureCard/);
}

console.log("=== CSS ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/sunnah-identity-cards.css")));
  const css = read("src/styles/sunnah-identity-cards.css");
  assert.match(css, /\.id-nav-card/);
  assert.match(css, /\.id-content-row/);
  assert.match(css, /\.id-detail-section/);
  assert.match(css, /\.id-quote-surface/);
  assert.match(css, /\.id-status-notice/);
  assert.match(css, /line-clamp:\s*2/);
  assert.match(css, /min-height:\s*0|box-shadow:\s*none/);
  assert.doesNotMatch(css, /!important/);
  const surfaces = read("src/components/design-system/IdentitySurfaces.tsx");
  assert.match(surfaces, /sunnah-identity-cards\.css/);
  const ir = read("src/styles/sunnah-identity-reset.css");
  assert.match(ir, /ss-feature-card__inner/);
  assert.match(ir, /section-entry-card/);
}

console.log("=== docs + package ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/SUNNAH_VISUAL_IDENTITY_RESET.md"), "utf8");
  assert.match(doc, /PR-3/);
  assert.match(doc, /CompactNavigationCard|ContentRow/);
  const pkg = read("package.json");
  assert.match(pkg, /test:sunnah-identity-reset-pr3/);
}

console.log("sunnah-identity-reset-pr3-gate.test.ts: ok");
