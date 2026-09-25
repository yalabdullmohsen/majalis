/**
 * Mushaf appearance + ayah interaction fix gate.
 * Run: node --import tsx src/lib/__tests__/mushaf-appearance-ayah-interaction-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const css = read("src/features/mushaf-reader/mushaf-reader.css");
const chrome = read("src/styles/reader-page-chrome.css");
const verse = read("src/features/mushaf-reader/MushafVerseLayer.tsx");
const page = read("src/features/mushaf-reader/MushafPage.tsx");
const madinahCss = read("src/features/mushaf-madinah/mushaf-madinah.css");

console.log("=== MushafAyahMarker + OpeningSpread ===");
assert.ok(existsSync(resolve(majalisRoot, "src/features/mushaf-reader/MushafAyahMarker.tsx")));
assert.ok(existsSync(resolve(majalisRoot, "src/features/mushaf-reader/MushafOpeningSpreadLayout.tsx")));
assert.match(verse, /MushafAyahMarker/);
assert.match(page, /MushafOpeningSpreadLayout/);
assert.doesNotMatch(verse, /OpeningAyahMarker|GreenAyahMarker|GoldAyahMarker/);

console.log("=== GOLD night remapper (no emerald lock) ===");
assert.match(css, /--mushaf-accent-fill-night:\s*#c4a030/i);
assert.match(css, /html\[data-mushaf-appearance="night"\] \.nm-root/);
assert.match(
  css,
  /--mushaf-accent-primary:\s*var\(--mushaf-verse-marker-dark-fill\);\s*\n\s*--mushaf-accent-secondary:\s*var\(--mushaf-verse-marker-dark-border\);\s*\n\s*--mushaf-marker-background:\s*var\(--mushaf-verse-marker-dark-fill\)/,
);
assert.match(css, /--mushaf-accent-fill:\s*var\(--quran-gold\)/);
assert.match(css, /\[data-mushaf-accent="gold"\]/);
assert.doesNotMatch(css, /data-mushaf-accent="emerald"/);
assert.doesNotMatch(css, /--mushaf-accent-fill:\s*#0e7a6b/i);
assert.match(css, /--mushaf-accent-strong:/);
assert.match(css, /--mushaf-accent-soft:/);

console.log("=== Unified marker scale (no opening inflation) ===");
assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
assert.match(css, /--mushaf-ayah-mark-font-size:\s*0\.62em/);
assert.match(css, /--mushaf-ayah-mark-number-size:\s*1\.52em/);
assert.doesNotMatch(chrome, /--mushaf-ayah-mark-size:\s*1\.22em/);
assert.doesNotMatch(chrome, /font-size:\s*var\(--mushaf-ayah-mark-number-size,\s*0\.7em\)/);

console.log("=== Ayah body tap + edge strip narrowed ===");
assert.match(verse, /كلمات المتن قابلة للتحديد/);
assert.match(verse, /data-testid=\{interactive \? "mushaf-ayah-hit"/);
assert.match(verse, /tabIndex=\{interactive \? -1/);
assert.match(verse, /blurAyahHitTarget/);
assert.doesNotMatch(verse, /tabIndex=\{interactive \? 0/);
assert.doesNotMatch(verse, /tabIndex=\{0\}/);
assert.match(madinahCss, /\.mm-page-edge--next\s*\{[^}]*width:\s*8%/s);
assert.match(madinahCss, /\.mm-page-edge--prev\s*\{[^}]*width:\s*8%/s);
assert.doesNotMatch(css, /transform:\s*scale\(/);
assert.match(css, /touch-action:\s*manipulation/);
assert.match(css, /-webkit-touch-callout:\s*none/);

console.log("mushaf-appearance-ayah-interaction-gate.test.ts: ok");
