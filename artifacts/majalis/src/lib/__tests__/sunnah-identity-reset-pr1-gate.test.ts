/**
 * SUNNAH VISUAL IDENTITY RESET — PR-1 gate
 * Typography roles · Density · Surfaces على مصدر V2 المشترك.
 * Run: node --import tsx src/lib/__tests__/sunnah-identity-reset-pr1-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { V2_TYPE, V2_FONT, V2_DENSITY, V2_SURFACE } from "../ssunnah-theme.ts";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== Identity Reset tokens in V2 file ===");
{
  const tokens = read("src/styles/visual-redesign-v2-tokens.css");
  assert.match(tokens, /Identity Reset/);
  assert.match(tokens, /--v2-font-display/);
  assert.match(tokens, /--v2-font-ui/);
  assert.match(tokens, /--v2-font-latin/);
  assert.match(tokens, /--v2-type-display/);
  assert.match(tokens, /--v2-type-page-title/);
  assert.match(tokens, /--v2-type-section-title/);
  assert.match(tokens, /--v2-type-card-title/);
  assert.match(tokens, /--v2-type-body/);
  assert.match(tokens, /--v2-type-supporting/);
  assert.match(tokens, /--v2-type-metadata/);
  assert.match(tokens, /--v2-type-caption/);
  assert.match(tokens, /--v2-surface-canvas/);
  assert.match(tokens, /--v2-surface-raised/);
  assert.match(tokens, /--v2-surface-functional/);
  assert.match(tokens, /--v2-accent-gold/);
  assert.match(tokens, /data-density="compact"/);
  assert.match(tokens, /data-density="standard"/);
  assert.match(tokens, /data-density="comfortable"/);
  assert.match(tokens, /--v2-focus-ring/);
  assert.match(tokens, /--v2-duration-press/);
  // لا مكتبة خطوط جديدة
  assert.doesNotMatch(tokens, /IBM Plex|Inter|Roboto|Cairo/);
}

console.log("=== application layer ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/sunnah-identity-reset.css")));
  const ir = read("src/styles/sunnah-identity-reset.css");
  assert.match(ir, /data-v2-app/);
  assert.match(ir, /--v2-font-ui|--font-ui/);
  assert.match(ir, /data-display-type/);
  assert.match(ir, /navbar-menu-btn--drawer/);
  assert.match(ir, /line-clamp:\s*2/);
  assert.match(ir, /text-align:\s*start/);
  assert.match(ir, /--v2-focus-ring/);
  assert.doesNotMatch(ir, /Aref Ruqaa/);
  assert.doesNotMatch(ir, /mushaf-reader|qpc-v2/);
  const fontGate = read("scripts/verify-font-consistency.mjs");
  assert.match(fontGate, /v2-font-\(display\|ui\|latin\)/);
}

console.log("=== wired in main + App density ===");
{
  const main = read("src/main.tsx");
  assert.match(main, /sunnah-identity-reset\.css/);
  assert.match(main, /visual-redesign-v2-tokens\.css/);
  const app = read("src/App.tsx");
  assert.match(app, /data-density/);
  assert.match(app, /standard/);
}

console.log("=== Aref removed from chrome drawer button ===");
{
  const index = read("src/index.css");
  assert.doesNotMatch(
    index,
    /\.navbar-menu-btn--drawer\s*\{[^}]*Aref Ruqaa/s,
    "لا Aref Ruqaa في زر القائمة",
  );
  assert.match(index, /\.navbar-menu-btn--drawer[\s\S]*--v2-font-ui/);
}

console.log("=== TS aliases ===");
assert.equal(V2_TYPE.pageTitle, "var(--v2-type-page-title)");
assert.equal(V2_FONT.ui, "var(--v2-font-ui)");
assert.equal(V2_DENSITY.padCard, "var(--v2-pad-card)");
assert.equal(V2_SURFACE.canvas, "var(--v2-surface-canvas)");

console.log("=== docs ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/SUNNAH_VISUAL_IDENTITY_RESET.md"), "utf8");
  assert.match(doc, /Identity Reset/);
  assert.match(doc, /Typography/);
  assert.match(doc, /Density/);
  assert.match(doc, /PR-1/);
  assert.match(doc, /sunnah-identity-reset\.css/);
  assert.match(doc, /no mushaf|لا.*مصحف|Out of scope/i);
}

console.log("=== package script ===");
{
  const pkg = read("package.json");
  assert.match(pkg, /test:sunnah-identity-reset-pr1/);
}

console.log("sunnah-identity-reset-pr1-gate.test.ts: ok");
