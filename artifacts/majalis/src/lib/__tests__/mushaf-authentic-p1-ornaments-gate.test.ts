/**
 * بوابة P1: مصحف سُنّة Content Driven — بلا إطار/ميدالية؛ كارتوش السورة وظيفي.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/features/mushaf-reader/MushafPage.tsx");
const banner = read("src/features/mushaf-reader/MushafSurahBanner.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const registry = read("docs/mushaf/SUNNAH_MUSHAF_ASSET_REGISTRY.md");
const preset = read("src/features/mushaf-reader/sunnah-mushaf-signature-preset.ts");
const engine = read("src/features/mushaf-reader/page-layout-engine.ts");

assert.match(page, /isOpeningP1/);
assert.match(page, /page-layout-engine|resolveSlotOrder/);
assert.doesNotMatch(page, /nm-page__ornament-frame|AuthenticWarmMushafPageFrame/);
assert.doesNotMatch(page, /nm-page__fatiha-medallion|SunnahFatihaBraidedMedallion|SunnahFatihaMedallion/);
assert.doesNotMatch(page, /headerSurahName/);
assert.doesNotMatch(page, /nm-page__header-surah/);

assert.match(banner, /SunnahSurahCartoucheCompact|SunnahSurahTitleCartouche/);
assert.match(banner, /nm-surah-banner__label/);
assert.match(banner, /سورة \$\{label\}/);

assert.match(css, /--mushaf-paper-light/);
assert.match(css, /--mushaf-gold-primary/);
assert.match(css, /--mushaf-page-border/);
assert.match(read("src/styles/reader-page-chrome.css"), /Content Driven Layout/);
assert.match(css, /clip-path:\s*polygon/);
assert.doesNotMatch(css, /\.nm-page__ornament-frame\s*\{/);
assert.doesNotMatch(css, /\.nm-page__fatiha-medallion\s*\{/);

assert.match(engine, /resolveOpeningHeaderSlots/);
assert.match(preset, /SIGNATURE_FONT_SIZE_MAX_PX\s*=\s*24/);
assert.doesNotMatch(css, /FittedBox|object-fit:\s*contain/);
assert.doesNotMatch(page, /backgroundImage|mushaf-ref\/|\.png['"]|\.jpg['"]/);
assert.doesNotMatch(css, /url\(\s*['"][^)'"]*(mushaf-ref|page-\d+\.(png|jpg))/);

assert.match(registry, /sunnah-page-frame-v1|sunnah-fatiha-medallion-v1/);
assert.match(registry, /removed — content-driven opening/);
assert.match(registry, /createdForSunnah/);
assert.match(registry, /rejected/);

console.log("mushaf-authentic-p1-ornaments-gate.test.ts: ok");
