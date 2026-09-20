/**
 * بوابة SVL PR-3 — طباعة + رؤوس صفحات/أقسام موحّدة.
 * node --import tsx src/lib/__tests__/sunnah-visual-headers-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const files = {
  css: "src/styles/sunnah-visual-language.css",
  heroCss: "src/styles/components/page-hero.css",
  pageHero: "src/components/ui/PageHero.tsx",
  compact: "src/components/ui/CompactSectionHeader.tsx",
  ornament: "src/components/design-system/geometry/HeaderOrnament.tsx",
  section: "src/components/design-system/headers/SvlSectionHeader.tsx",
  ds: "src/components/design-system/index.ts",
  doc: "docs/design/SUNNAH_VISUAL_LANGUAGE.md",
  cleanup: "src/styles/card-decorative-strip-cleanup.css",
};

for (const [key, rel] of Object.entries(files)) {
  assert.ok(existsSync(resolve(root, rel)), `مفقود (${key}): ${rel}`);
}

const css = read(files.css);
const heroCss = read(files.heroCss);
const pageHero = read(files.pageHero);
const compact = read(files.compact);
const ornament = read(files.ornament);
const section = read(files.section);
const ds = read(files.ds);
const doc = read(files.doc);
const cleanup = read(files.cleanup);

for (const token of [
  "--svl-type-display",
  "--svl-type-page-title",
  "--svl-type-section-title",
  "--svl-type-card-title",
  "--svl-type-body-lg",
  "--svl-type-body",
  "--svl-type-supporting",
  "--svl-type-metadata",
  "--svl-type-caption",
  "--svl-header-ornament-bg",
]) {
  assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), token);
}

assert.match(css, /\.svl-page-header/);
assert.match(css, /\.svl-section-header/);
assert.match(css, /section-lobby__title::after/);
assert.match(css, /quran-hub-page__title::after/);
assert.match(css, /--svl-header-ornament-bg/);

assert.doesNotMatch(heroCss, /border-inline-start:\s*[34]px\s+solid/);
assert.match(heroCss, /border-inline-start-width:\s*1px/);

assert.match(pageHero, /HeaderOrnament/);
assert.match(pageHero, /GeometricMotif/);
assert.match(pageHero, /svl-page-header/);
assert.match(compact, /HeaderOrnament/);
assert.match(compact, /SectionHeader/);
assert.match(ornament, /aria-hidden/);
assert.match(ornament, /svl-header-ornament/);
assert.match(section, /SvlSectionHeader/);
assert.match(section, /HeaderOrnament/);
assert.match(ds, /HeaderOrnament/);
assert.match(ds, /SvlSectionHeader/);
assert.match(ds, /SectionHeader/);

assert.match(cleanup, /\.page-hero-mj--bleed:not\(\.home-page-hero\)/);

const shell = read("src/styles/components/modern-section-shell.css");
assert.doesNotMatch(
  shell,
  /border-inline-start:\s*[34]px\s+solid/,
  "هيروات الأقسام في modern-section-shell بلا عمود جانبي",
);

assert.match(doc, /PR-3/);
assert.match(doc, /HeaderOrnament|رؤوس|طباعة/);
assert.match(doc, /لا إعلان|SUNNAH_VISUAL_EXCELLENCE_COMPLETE/);

const pkg = read("package.json");
assert.match(pkg, /sunnah-visual-headers-gate/, "البوابة مربوطة في package.json");

console.log("sunnah-visual-headers-gate.test.ts: ok");
