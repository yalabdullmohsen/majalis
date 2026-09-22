/**
 * SUNNAH VISUAL IDENTITY RESET — PR-5 gate
 * Sections lobby + category grids densify
 * Run: node --import tsx src/lib/__tests__/sunnah-identity-reset-pr5-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== sections page ===");
{
  const page = read("src/pages/account/SectionsPage.tsx");
  assert.match(page, /MoreHubFromRegistry|SectionsHubFromRegistry/);
  assert.match(page, /PageHeaderV2/);
  assert.match(page, /GridScreen/);
  assert.match(page, /sunnah-identity-sections\.css/);
  assert.doesNotMatch(page, /MushafReader|VerifiedMushaf|qpc-v2|AdminV3/);
}

console.log("=== CSS densify ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/sunnah-identity-sections.css")));
  const css = read("src/styles/sunnah-identity-sections.css");
  assert.match(css, /data-v2-sections/);
  assert.match(css, /hub-card/);
  assert.match(css, /min-height:\s*0/);
  assert.match(css, /fiqh-category-grid|qa-v2-category-grid|ruling-category-grid|hadith-hub-grid/);
  assert.match(css, /line-clamp:\s*2/);
  assert.doesNotMatch(css, /!important/);
  assert.doesNotMatch(css, /mushaf-reader|qpc-v2|AdminV3/);
}

console.log("=== route wiring (not critical main) ===");
{
  const main = read("src/main.tsx");
  assert.doesNotMatch(main, /sunnah-identity-sections\.css/);
  const lobby = read("src/components/lobby/SectionLobby.tsx");
  assert.match(lobby, /sunnah-identity-sections\.css/);
  const fiqh = read("src/pages/fiqh/ui/FiqhView.tsx");
  assert.match(fiqh, /sunnah-identity-sections\.css/);
}

console.log("=== docs + package ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/SUNNAH_VISUAL_IDENTITY_RESET.md"), "utf8");
  assert.match(doc, /PR-5/);
  assert.match(doc, /Sections|category|أقسام|شبكات/i);
  const pkg = read("package.json");
  assert.match(pkg, /test:sunnah-identity-reset-pr5/);
}

console.log("sunnah-identity-reset-pr5-gate.test.ts: ok");
