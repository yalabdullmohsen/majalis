/**
 * Foundation Reset PR-0 — وجود خريطة الاعتماديات + Baseline + تصنيفات إلزامية.
 * Run: node --import tsx src/lib/__tests__/sunnah-foundation-reset-pr0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const docPath = resolve(repoRoot, "docs/design/SUNNAH_FOUNDATION_RESET_PR0_BASELINE.md");
const baselineDir = resolve(repoRoot, "docs/design/foundation-reset-baseline");

assert.ok(existsSync(docPath), "PR-0 baseline doc missing");
const doc = readFileSync(docPath, "utf8");

assert.match(doc, /Dependency Map/i);
assert.match(doc, /\bKEEP\b/);
assert.match(doc, /\bCONSOLIDATE\b/);
assert.match(doc, /\bPORT\b/);
assert.match(doc, /\bREMOVE\b/);
assert.match(doc, /\bBLOCKED\b/);
assert.match(doc, /Root Causes|السبب الجذري/);
assert.match(doc, /green-surface-system/);
assert.match(doc, /final-release\.css/);
assert.match(doc, /FloatingBackButton|ScrollToTop/);
assert.match(doc, /ExploreAlsoNav|fg-related--footer/);
assert.match(doc, /data-mushaf-accent/);
assert.match(doc, /MushafAppearanceTheme|EMERALD|GOLD/);
assert.match(doc, /sutr-01|hadith_number|Internal ID/i);
assert.match(doc, /SunnahFoundation|PR-1/);
assert.match(doc, /FloatingLayerManager/);

assert.ok(existsSync(baselineDir), "baseline screenshots dir missing");
const shots = readdirSync(baselineDir).filter((f) => f.endsWith(".png"));
const required = [
  "01-home.png",
  "02-quran-hub.png",
  "03-hadith.png",
  "04-mushaf-p1-emerald.png",
  "05-mushaf-p1-gold.png",
  "06-mushaf-p2-emerald.png",
  "07-mushaf-p3-gold.png",
];
for (const name of required) {
  assert.ok(shots.includes(name), `missing baseline shot: ${name}`);
}

// Cascade truth: main.tsx still loads conflicting layers (inventory lock)
const main = readFileSync(resolve(majalisRoot, "src/main.tsx"), "utf8");
assert.match(main, /brand-v4\.css/);
assert.match(main, /green-surface-system\.css/);
assert.match(main, /final-release\.css/);
assert.match(main, /visual-identity-unify\.css/);
assert.match(main, /sunnah-visual-language\.css/);

console.log("sunnah-foundation-reset-pr0-gate.test.ts: ok");
