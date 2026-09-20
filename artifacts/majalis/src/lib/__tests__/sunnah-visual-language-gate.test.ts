/**
 * بوابة أساس Sunnah Visual Language — موجة PR-1.
 * node --import tsx src/lib/__tests__/sunnah-visual-language-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const files = {
  doc: "docs/design/SUNNAH_VISUAL_LANGUAGE.md",
  css: "src/styles/sunnah-visual-language.css",
  motif: "src/components/design-system/geometry/GeometricMotif.tsx",
  divider: "src/components/design-system/geometry/GeometricDivider.tsx",
  medallion: "src/components/design-system/geometry/IconMedallion.tsx",
  geoIndex: "src/components/design-system/geometry/index.ts",
  dsIndex: "src/components/design-system/index.ts",
  main: "src/main.tsx",
};

for (const [key, rel] of Object.entries(files)) {
  assert.ok(existsSync(resolve(root, rel)), `مفقود (${key}): ${rel}`);
}

const doc = read(files.doc);
const css = read(files.css);
const main = read(files.main);
const ds = read(files.dsIndex);
const motif = read(files.motif);
const divider = read(files.divider);

assert.match(doc, /Sunnah Visual Language/);
assert.match(doc, /PR-1/);
assert.match(doc, /green-surface-system|شريط أخضر/);
assert.match(doc, /لا إعلان|SUNNAH_VISUAL_EXCELLENCE_COMPLETE/);

for (const token of [
  "--svl-background-primary",
  "--svl-background-secondary",
  "--svl-surface-primary",
  "--svl-surface-elevated",
  "--svl-surface-accent-soft",
  "--svl-text-primary",
  "--svl-text-secondary",
  "--svl-text-muted",
  "--svl-border-subtle",
  "--svl-border-strong",
  "--svl-accent-primary",
  "--svl-accent-gold",
  "--svl-success",
  "--svl-warning",
  "--svl-error",
  "--svl-radius-sm",
  "--svl-radius-md",
  "--svl-radius-lg",
  "--svl-radius-pill",
]) {
  assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), token);
}

for (const cls of [
  ".svl-app-bg",
  ".svl-section-surface",
  ".svl-card-surface",
  ".svl-elevated",
  ".svl-motif",
  ".svl-divider",
  ".svl-pattern",
  ".svl-medallion",
  ".svl-header-ornament",
  ".svl-quote",
]) {
  assert.match(css, new RegExp(cls.replace(/\./g, "\\.")), cls);
}

assert.match(css, /pointer-events:\s*none/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /mushaf|mm-reader/i);
assert.match(css, /border-inline-start-width:\s*1px\s*!important/);
assert.doesNotMatch(css, /border-inline-start:\s*[34]px/);

assert.match(main, /sunnah-visual-language\.css/);
assert.match(ds, /GeometricMotif/);
assert.match(ds, /GeometricDivider/);
assert.match(ds, /IconMedallion/);

assert.match(motif, /aria-hidden/);
assert.match(divider, /aria-hidden/);
assert.match(divider, /role="separator"/);

const pkg = read("package.json");
assert.match(pkg, /sunnah-visual-language-gate/, "البوابة مربوطة في package.json");
assert.match(css, /--svl-type-page-title|--svl-type-display/, "رموز طباعة SVL (PR-3)");

console.log("sunnah-visual-language-gate.test.ts: ok");
