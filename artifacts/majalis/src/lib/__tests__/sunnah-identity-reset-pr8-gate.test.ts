/**
 * SUNNAH VISUAL IDENTITY RESET — PR-8 gate
 * Forms + Tabs + Filters densify
 * Run: node --import tsx src/lib/__tests__/sunnah-identity-reset-pr8-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== filter wiring ===");
{
  const chip = read("src/components/filters/FilterChip.tsx");
  assert.match(chip, /mj-filter-chip/);
  assert.match(chip, /sunnah-identity-forms-filters\.css/);
  const bar = read("src/components/filters/FilterBar.tsx");
  assert.match(bar, /sunnah-identity-forms-filters\.css/);
  const seg = read("src/components/filters/SegmentedFilter.tsx");
  assert.match(seg, /sunnah-identity-forms-filters\.css/);
  const login = read("src/pages/account/ui/LoginView.tsx");
  assert.match(login, /sunnah-identity-forms-filters\.css/);
  assert.doesNotMatch(login, /AdminV3|qpc-v2|MushafReader/);
}

console.log("=== CSS densify ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/sunnah-identity-forms-filters.css")));
  const css = read("src/styles/sunnah-identity-forms-filters.css");
  assert.match(css, /data-v2-app/);
  assert.match(css, /mj-filter-chip|filter-chips__chip/);
  assert.match(css, /mj-filter-bar/);
  assert.match(css, /role=.tab.|topic-page__tab/);
  assert.match(css, /login-form|hus-field/);
  assert.match(css, /letter-spacing:\s*0/);
  assert.match(css, /v2-focus-ring/);
  assert.doesNotMatch(css, /mushaf-reader|qpc-v2|AdminV3/);
}

console.log("=== not critical main ===");
{
  const main = read("src/main.tsx");
  assert.doesNotMatch(main, /sunnah-identity-forms-filters\.css/);
  const reset = read("src/styles/sunnah-identity-reset.css");
  assert.match(reset, /PR-8|forms-filters/);
}

console.log("=== docs + package ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/SUNNAH_VISUAL_IDENTITY_RESET.md"), "utf8");
  assert.match(doc, /PR-8 deliverables|Forms \+ Tabs \+ Filters/);
  assert.match(doc, /Filter chips|Login\/auth|فلتر|تبويب/i);
  const pkg = read("package.json");
  assert.match(pkg, /test:sunnah-identity-reset-pr8/);
}

console.log("sunnah-identity-reset-pr8-gate.test.ts: ok");
