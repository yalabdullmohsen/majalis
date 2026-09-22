/**
 * First Spread Visual Layout — ص١–ص٢.
 * كتلة قراءة متماسكة · Accent يتبع Theme · بلا مساس بالنص/QPC.
 * Run: node --import tsx src/lib/__tests__/mushaf-opening-first-spread-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mushafOpeningTurquoise,
  mushafOpeningMarkerFill,
  mushafVerseMarkerFill,
  quranGold,
} from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/features/mushaf-reader/MushafPage.tsx");
const chrome = read("src/styles/reader-page-chrome.css");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const data = read("src/lib/quran-data/qpc-page-data.ts");
const tokens = read("src/features/mushaf-reader/mushaf-warm-yellow-tokens.ts");

console.log("=== لا مساس بالنص / التقسيم ===");
assert.match(page, /MushafOpeningPageLayout/);
assert.match(page, /layout\.pageNumber === 1/);
assert.match(page, /layout\.pageNumber === 2/);
assert.doesNotMatch(page, /replace\(|mutateAyah|editGlyph|OCR|letter-spacing:\s*[^0]/);
assert.doesNotMatch(page, /headerSurahName|nm-page__header-surah/);
assert.match(data, /bannerSlot = 1/);
assert.match(data, /isOpening/);

console.log("=== كتلة قراءة متماسكة (لا space-evenly على body) ===");
assert.match(chrome, /\.nm-page--opening \.nm-page__body[\s\S]{0,200}align-content:\s*center/);
assert.doesNotMatch(
  chrome,
  /\.nm-page--opening \.nm-page__body[\s\S]{0,200}align-content:\s*space-evenly/,
);
assert.match(chrome, /row-gap:\s*0\.14em/);
assert.match(chrome, /width:\s*min\(100%,\s*22\.5rem\)/);
assert.match(css, /align-content:\s*center/);
assert.doesNotMatch(
  css,
  /\.nm-page--opening \.nm-page__body[\s\S]{0,200}align-content:\s*space-evenly/,
);

console.log("=== Accent موحّد · لوحة زمردي/ذهب محفوظة ===");
assert.equal(mushafOpeningTurquoise.toLowerCase(), "#0e7a6b");
assert.equal(mushafOpeningMarkerFill.toLowerCase(), "#0e7a6b");
assert.equal(mushafVerseMarkerFill.toLowerCase(), quranGold.toLowerCase());
assert.match(tokens, /mushafOpeningTurquoise|mushafEmeraldPrimary/);
assert.match(css, /--mushaf-accent-primary:\s*#0e7a6b/i);
assert.match(css, /\[data-mushaf-accent="gold"\]/);
assert.doesNotMatch(
  chrome,
  /\.nm-page--opening[\s\S]{0,500}--mushaf-verse-marker-fill:\s*var\(--mushaf-opening/,
);
assert.match(chrome, /\.nm-page--opening \.nm-ayah-mark[\s\S]{0,200}mushaf-marker-background/);
assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);

console.log("=== Metadata pills + footer surface ===");
assert.match(chrome, /mushaf-opening-meta-surface/);
assert.match(chrome, /\.nm-page--opening \.nm-page__header-juz/);
assert.match(chrome, /\.nm-page--opening \.nm-page__footer-num/);

console.log("=== لا letter-spacing على النص القرآني ===");
assert.match(css, /\.nm-basmala\s*\{[^}]*letter-spacing:\s*0\b/s);
assert.doesNotMatch(css, /\.nm-basmala\s*\{[^}]*letter-spacing:\s*0\.01em/s);
assert.doesNotMatch(chrome, /\.nm-page--opening[\s\S]{0,400}letter-spacing:\s*[1-9]/);

console.log("mushaf-opening-first-spread-gate.test.ts: ok");
