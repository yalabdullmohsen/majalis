/**
 * SUNNAH VISUAL IDENTITY RESET — PR-7 gate
 * Drawer + Bottom Nav + floating chrome
 * Run: node --import tsx src/lib/__tests__/sunnah-identity-reset-pr7-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== BottomNav wiring ===");
{
  const nav = read("src/components/BottomNavBar.tsx");
  assert.match(nav, /BOTTOM_NAV_TABS|bottom-nav/);
  assert.match(nav, /sunnah-identity-chrome-nav\.css/);
  assert.doesNotMatch(nav, /AdminV3|VerifiedMushaf|qpc-v2/);
}

console.log("=== Drawer + floating wiring ===");
{
  const drawer = read("src/components/SideNavDrawer.tsx");
  assert.match(drawer, /sunnah-identity-chrome-nav\.css/);
  const fab = read("src/components/FloatingBackButton.tsx");
  assert.match(fab, /sunnah-identity-chrome-nav\.css/);
  const assistant = read("src/components/assistant/AssistantFloatingWidget.tsx");
  assert.match(assistant, /sunnah-identity-chrome-nav\.css/);
}

console.log("=== CSS densify ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/sunnah-identity-chrome-nav.css")));
  const css = read("src/styles/sunnah-identity-chrome-nav.css");
  assert.match(css, /data-v2-nav/);
  assert.match(css, /bottom-nav/);
  assert.match(css, /sidebar-item|drawer-panel/);
  assert.match(css, /fixed-back-bar|floating-back-btn|assistant-fab/);
  assert.match(css, /letter-spacing:\s*0/);
  assert.match(css, /v2-shadow-soft|v2-focus-ring/);
  assert.doesNotMatch(css, /!important/);
  assert.doesNotMatch(css, /mushaf-reader|qpc-v2|AdminV3|ImmersivePrefs/);
}

console.log("=== not critical main ===");
{
  const main = read("src/main.tsx");
  assert.doesNotMatch(main, /sunnah-identity-chrome-nav\.css/);
  const reset = read("src/styles/sunnah-identity-reset.css");
  assert.match(reset, /PR-7|chrome-nav/);
}

console.log("=== docs + package ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/SUNNAH_VISUAL_IDENTITY_RESET.md"), "utf8");
  assert.match(doc, /PR-7/);
  assert.match(doc, /Drawer|Bottom|floating|شريط|درج/i);
  const pkg = read("package.json");
  assert.match(pkg, /test:sunnah-identity-reset-pr7/);
}

console.log("sunnah-identity-reset-pr7-gate.test.ts: ok");
