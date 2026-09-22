/**
 * SUNNAH VISUAL IDENTITY RESET — PR-9 gate
 * Dark Mode Luxury Night
 * Run: node --import tsx src/lib/__tests__/sunnah-identity-reset-pr9-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== App night wiring ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-night/);
  assert.match(app, /sunnah-identity-luxury-night\.css/);
  assert.match(app, /luxury-night-v2\.css/);
  assert.doesNotMatch(app, /AdminV3|qpc-v2/);
}

console.log("=== CSS luxury night ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/sunnah-identity-luxury-night.css")));
  const css = read("src/styles/sunnah-identity-luxury-night.css");
  assert.match(css, /data-v2-night/);
  assert.match(css, /data-v2-app/);
  assert.match(css, /v2-color-night-bg|v2-color-night-surface/);
  assert.match(css, /hub-card|sidebar-panel|topic-page__body/);
  assert.match(css, /night-emerald-text|night-gold/);
  assert.doesNotMatch(css, /mushaf-reader|qpc-v2|AdminV3/);
  assert.doesNotMatch(css, /!important/);
}

console.log("=== not critical main import ===");
{
  const main = read("src/main.tsx");
  assert.doesNotMatch(main, /sunnah-identity-luxury-night\.css/);
  const reset = read("src/styles/sunnah-identity-reset.css");
  assert.match(reset, /PR-9|luxury-night/);
}

console.log("=== docs + package ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/SUNNAH_VISUAL_IDENTITY_RESET.md"), "utf8");
  assert.match(doc, /PR-9 deliverables|Dark Mode Luxury Night/);
  assert.match(doc, /Luxury Night|night-surface|ليلي/i);
  const pkg = read("package.json");
  assert.match(pkg, /test:sunnah-identity-reset-pr9/);
}

console.log("sunnah-identity-reset-pr9-gate.test.ts: ok");
