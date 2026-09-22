/**
 * SUNNAH VISUAL IDENTITY RESET — PR-10 gate
 * Responsive + Accessibility + Visual QA
 * Run: node --import tsx src/lib/__tests__/sunnah-identity-reset-pr10-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== App responsive-a11y wiring ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /sunnah-identity-responsive-a11y\.css/);
  assert.match(app, /data-v2-app/);
  assert.doesNotMatch(app, /AdminV3|qpc-v2/);
}

console.log("=== CSS responsive + a11y ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/sunnah-identity-responsive-a11y.css")));
  const css = read("src/styles/sunnah-identity-responsive-a11y.css");
  assert.match(css, /data-v2-app/);
  assert.match(css, /pointer:\s*coarse/);
  assert.match(css, /2\.75rem/);
  assert.match(css, /max-width:\s*389px/);
  assert.match(css, /min-width:\s*768px/);
  assert.match(css, /--inset-(?:bottom|start|end)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /focus-visible/);
  assert.match(css, /--v2-focus-ring/);
  assert.doesNotMatch(css, /env\(\s*safe-area/);
  assert.doesNotMatch(css, /mushaf-reader|qpc-v2|AdminV3/);
  assert.doesNotMatch(css, /!important/);
}

console.log("=== not critical main import ===");
{
  const main = read("src/main.tsx");
  assert.doesNotMatch(main, /sunnah-identity-responsive-a11y\.css/);
  const reset = read("src/styles/sunnah-identity-reset.css");
  assert.match(reset, /PR-10|responsive-a11y/);
}

console.log("=== QA doc + train closure ===");
{
  const qa = readFileSync(resolve(repoRoot, "docs/design/SUNNAH_VISUAL_IDENTITY_RESET_QA.md"), "utf8");
  assert.match(qa, /Visual QA/);
  assert.match(qa, /Responsive/);
  assert.match(qa, /Accessibility|A11y/);
  assert.match(qa, /PR-10/);
  assert.match(qa, /sunnah-identity-responsive-a11y\.css/);
  for (const pr of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    assert.match(qa, new RegExp(`\\|\\s*${pr}\\s*\\|`));
  }
  assert.match(qa, /mushaf|مصحف/i);
  assert.match(qa, /Admin/);
}

console.log("=== docs + package ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/SUNNAH_VISUAL_IDENTITY_RESET.md"), "utf8");
  assert.match(doc, /PR-10 deliverables|Responsive \+ Accessibility/);
  assert.match(doc, /SUNNAH_VISUAL_IDENTITY_RESET_QA\.md|responsive-a11y/);
  assert.match(doc, /\|\s*10\s*\|[^\n]*\*\*merged\*\*|\|\s*10\s*\|[^\n]*complete|PR-10[^\n]*merged/i);
  const pkg = read("package.json");
  assert.match(pkg, /test:sunnah-identity-reset-pr10/);
  assert.match(pkg, /test:sunnah-identity-reset-pr9.*test:sunnah-identity-reset-pr10|test:sunnah-identity-reset-pr10/);
}

console.log("sunnah-identity-reset-pr10-gate.test.ts: ok");
