/**
 * Gate: رقم الصفحة ص١–ص٢ + مظهر GOLD يصل للعلامات عبر Tokens.
 * Run: node --import tsx src/lib/__tests__/mushaf-page-number-gold-contract-gate.test.ts
 *
 * ROOT: CLIPPED_BY_OVERFLOW — OpeningSpread كان يلفّ الرأس+التذييل.
 * GOLD: data-mushaf-accent + --mushaf-marker-* + --mm-ui-accent مزامَن.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const page = read("src/features/mushaf-reader/MushafPage.tsx");
const pageNumber = read("src/features/mushaf-reader/MushafPageNumber.tsx");
const opening = read("src/features/mushaf-reader/MushafOpeningSpreadLayout.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const chrome = read("src/styles/reader-page-chrome.css");
const provider = read("src/lib/mushaf-v2/MushafAppearanceProvider.tsx");

console.log("=== MushafPageNumber single component ===");
assert.match(pageNumber, /data-component="MushafPageNumber"/);
assert.match(pageNumber, /toArabicPageDigits\(pageNumber\)/);
assert.doesNotMatch(pageNumber, /['"][١٢12]['"]/);
assert.match(page, /import \{ MushafPageNumber \}/);
assert.match(page, /<MushafPageNumber pageNumber=\{footerPage\}/);
assert.doesNotMatch(page, /className="nm-page__footer-num"/);

console.log("=== OpeningSpread wraps stage only (not header/footer) ===");
assert.match(page, /MushafOpeningSpreadLayout pageNumber=\{isOpeningP1 \? 1 : 2\}>\{stage\}/);
assert.match(opening, /صف المتن فقط/);
assert.match(chrome, /\.nm-opening-spread\s*\{[\s\S]*?display:\s*flex/);
assert.match(chrome, /\.nm-opening-spread > \.nm-page__stage/);

console.log("=== Footer is direct child of nm-page grid ===");
assert.match(page, /<footer[\s\S]*?<MushafPageNumber/);
assert.doesNotMatch(
  page,
  /MushafOpeningSpreadLayout[\s\S]*?<footer[\s\S]*?<\/MushafOpeningSpreadLayout>/,
);

console.log("=== No hardcoded page digits 1/2 in opening template ===");
assert.doesNotMatch(page, />\s*[١٢]\s*</);
assert.doesNotMatch(page, /toArabicPageDigits\(\s*[12]\s*\)/);

console.log("=== GOLD / EMERALD tokens on markers + page number ===");
assert.match(css, /--mushaf-page-number:\s*var\(--mushaf-accent-fill\)/);
assert.match(css, /--mushaf-page-control:\s*var\(--mushaf-accent-fill-strong\)/);
assert.match(css, /\[data-mushaf-accent="gold"\][\s\S]{0,2000}--mushaf-page-number/);
assert.match(css, /\[data-mushaf-accent="gold"\][\s\S]{0,2000}--mm-ui-accent:\s*var\(--mushaf-accent-fill\)/);
assert.match(css, /\.nm-root\.mm-viewport\s*\{[\s\S]*?--mm-ui-accent:\s*var\(--mushaf-accent-fill\)/);
assert.match(css, /background:\s*var\(--mushaf-verse-marker-fill\)/);
assert.match(css, /\.nm-ayah-mark\s*\{/);
assert.match(chrome, /\.nm-page--opening \.nm-ayah-mark[\s\S]{0,200}mushaf-marker-background/);
assert.match(chrome, /\.nm-page--opening \.nm-page__footer-num[\s\S]{0,500}--mushaf-page-number/);

console.log("=== Provider single source ===");
assert.match(provider, /MushafAppearanceProvider/);
assert.match(provider, /applyMushafAccentTheme/);
assert.match(provider, /saveMushafAccentTheme\(next\)/);
assert.doesNotMatch(provider, /isGreen|isGold|GreenAyahMarker|GoldAyahMarker/);

console.log("mushaf-page-number-gold-contract-gate.test.ts: ok");
