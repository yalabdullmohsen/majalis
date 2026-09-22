/**
 * Foundation Reset PR-1 — SunnahFoundationTokens + Typography + Density.
 * Run: node --import tsx src/lib/__tests__/sunnah-foundation-reset-pr1-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SF_COLOR,
  SF_DENSITY,
  SF_TYPE_SCALE,
  SunnahFoundationTokens,
} from "../sunnah-foundation-tokens.ts";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const cssPath = "src/styles/sunnah-foundation-tokens.css";
const tsPath = "src/lib/sunnah-foundation-tokens.ts";
const lintPath = "scripts/lint-sunnah-foundation-tokens.mjs";
const docPath = resolve(repoRoot, "docs/design/SUNNAH_FOUNDATION_RESET_PR1_TOKENS.md");

assert.ok(existsSync(resolve(majalisRoot, cssPath)), "foundation CSS missing");
assert.ok(existsSync(resolve(majalisRoot, tsPath)), "foundation TS missing");
assert.ok(existsSync(resolve(majalisRoot, lintPath)), "foundation lint missing");
assert.ok(existsSync(docPath), "PR-1 doc missing");

const css = read(cssPath);
const main = read("src/main.tsx");
const v2 = read("src/styles/visual-redesign-v2-tokens.css");
const typeScale = read("src/styles/typography-scale.css");

/* main: foundation قبل brand-v4 */
{
  const sf = main.indexOf("sunnah-foundation-tokens.css");
  const brand = main.indexOf("brand-v4.css");
  assert.ok(sf >= 0, "main يستورد foundation");
  assert.ok(brand > sf, "foundation قبل brand-v4");
}

/* لوحة الألوان الخمسة */
for (const token of [
  "--sf-color-warm-ivory",
  "--sf-color-deep-emerald",
  "--sf-color-quran-gold",
  "--sf-color-rich-ink",
  "--sf-color-luxury-night",
]) {
  assert.match(css, new RegExp(token.replace(/-/g, "\\-")));
}

/* Typography scale */
for (const role of [
  "display",
  "page-title",
  "section-title",
  "card-title",
  "body",
  "supporting",
  "metadata",
  "caption",
]) {
  assert.match(css, new RegExp(`--sf-type-${role.replace(/-/g, "\\-")}`));
}
assert.equal(SF_TYPE_SCALE.length, 8);
assert.ok(SF_TYPE_SCALE.includes("pageTitle"));

/* Density */
assert.match(css, /data-density="compact"/);
assert.match(css, /data-density="standard"/);
assert.match(css, /data-density="reading"/);
assert.equal(SF_DENSITY.reading, "reading");
assert.equal(SF_DENSITY.compact, "compact");
assert.equal(SF_DENSITY.standard, "standard");

/* Spacing / Radius / Shadow / Layer / SafeArea */
for (const token of [
  "--sf-space-4",
  "--sf-radius-card",
  "--sf-shadow-card",
  "--sf-layer-nav",
  "--sf-safe-top",
  "--sf-focus-ring",
  "--sf-surface-canvas",
]) {
  assert.match(css, new RegExp(token.replace(/-/g, "\\-")));
}

/* Fonts: Display + UI؛ زخرفي للعرض فقط */
assert.match(css, /--sf-font-display/);
assert.match(css, /--sf-font-ui/);
assert.match(css, /--sf-font-ornament/);
assert.match(css, /ممنوع في تشغيل UI|لحظات عرض فقط/);

/* V2 جسر إلى foundation */
assert.match(v2, /--v2-color-ivory:\s*var\(--sf-color-ivory-canvas/);
assert.match(v2, /--v2-type-display:\s*var\(--sf-type-display/);
assert.match(v2, /--v2-pad-card:\s*var\(--sf-pad-card/);
assert.match(v2, /data-density="reading"/);

/* typography-scale جسر */
assert.match(typeScale, /--text-display:\s*var\(--sf-type-display/);

/* LEGACY_NON_SOT على الأنظمة المتعارضة */
for (const file of [
  "src/styles/brand-v4.css",
  "src/styles/green-surface-system.css",
  "src/styles/final-release.css",
  "src/styles/visual-identity-unify.css",
]) {
  assert.match(read(file), /LEGACY_NON_SOT/, `${file} يجب وسم LEGACY_NON_SOT`);
}

/* TS API */
assert.equal(SF_COLOR.deepEmerald, "var(--sf-color-deep-emerald)");
assert.equal(SunnahFoundationTokens.type.pageTitle, "var(--sf-type-page-title)");

/* Doc */
const doc = readFileSync(docPath, "utf8");
assert.match(doc, /SunnahFoundationTokens/);
assert.match(doc, /COMPACT|STANDARD|READING/);
assert.match(doc, /LEGACY_NON_SOT/);
assert.match(doc, /لا تعديل مصحف|لا تعدّل المصحف|بدون تعديل شاشات|بلا هجرة شاشات/);

console.log("sunnah-foundation-reset-pr1-gate.test.ts: ok");
