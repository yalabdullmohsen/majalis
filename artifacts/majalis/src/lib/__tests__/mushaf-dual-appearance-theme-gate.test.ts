/**
 * Mushaf Single Gold Appearance — مظهر ذهبي ثابت بلا اختيار.
 * Run: node --import tsx src/lib/__tests__/mushaf-dual-appearance-theme-gate.test.ts
 *
 * يفشل عند: واجهة اختيار · EMERALD · تخزين Accent · افتراضي زمردي في CSS.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MUSHAF_ACCENT_DEFAULT,
  MUSHAF_ACCENT_STORAGE_KEY_LEGACY,
  MUSHAF_GOLD_APPEARANCE,
  MUSHAF_SETTINGS_SCHEMA_VERSION,
  themeToAccentAttr,
} from "../../lib/mushaf-v2/mushaf-appearance-theme";
import { QURAN_EXPERIENCE_NEXT } from "../../lib/mushaf-v2/flags";
import {
  mushafVerseMarkerFill,
  quranGold,
} from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== Feature flag + gold-only contract ===");
assert.equal(QURAN_EXPERIENCE_NEXT.dualAppearanceThemes, false);
assert.equal(MUSHAF_ACCENT_DEFAULT, "GOLD");
assert.equal(MUSHAF_GOLD_APPEARANCE, "GOLD");
assert.equal(themeToAccentAttr("GOLD"), "gold");
assert.equal(MUSHAF_ACCENT_STORAGE_KEY_LEGACY, "ssunnah-mushaf-accent-theme-v1");
assert.equal(MUSHAF_SETTINGS_SCHEMA_VERSION, "2-gold-only");
assert.ok(existsSync(resolve(majalisRoot, "src/lib/mushaf-v2/accent-prefs.ts")));
assert.ok(existsSync(resolve(majalisRoot, "src/lib/mushaf-v2/mushaf-appearance-theme.ts")));

console.log("=== Tokens: gold default ===");
assert.equal(quranGold.toLowerCase(), "#c9a82e");
assert.equal(mushafVerseMarkerFill.toLowerCase(), "#c9a82e");

console.log("=== CSS: gold on .nm-root · لا زمردي افتراضي ===");
{
  const css = read("src/features/mushaf-reader/mushaf-reader.css");
  assert.match(css, /--mushaf-accent-fill:\s*var\(--quran-gold\)/);
  assert.match(css, /--mushaf-marker-background:\s*var\(--mushaf-accent-fill\)/);
  assert.match(css, /--mushaf-verse-marker-fill:\s*var\(--mushaf-marker-background\)/);
  assert.match(css, /--mushaf-ayah-mark-font-size:\s*0\.62em/);
  assert.match(css, /--mushaf-ayah-mark-number-size:\s*1\.52em/);
  assert.match(css, /\.nm-ayah-mark\s*\{[^}]*font-size:\s*var\(--mushaf-ayah-mark-font-size/s);
  assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
  assert.match(css, /--mushaf-accent-strong:/);
  assert.match(css, /--mushaf-accent-soft:/);
  assert.doesNotMatch(css, /--mushaf-accent-fill:\s*#0e7a6b/i);
  assert.doesNotMatch(css, /--mushaf-accent-fill-night:\s*#2a9b88/i);
  assert.doesNotMatch(css, /data-mushaf-accent="emerald"/);
  assert.doesNotMatch(css, /transform:\s*scale\(/);
}

console.log("=== Opening inherits gold (no turquoise split) ===");
{
  const chrome = read("src/styles/reader-page-chrome.css");
  assert.doesNotMatch(
    chrome,
    /\.nm-page--opening[\s\S]{0,400}--mushaf-verse-marker-fill:\s*var\(--mushaf-opening-marker-fill\)/,
  );
  assert.match(chrome, /\.nm-page--opening \.nm-ayah-mark[\s\S]{0,200}mushaf-marker-background/);
}

console.log("=== No accent picker UI ===");
{
  const controls = read("src/features/mushaf-reader/MushafControlsLayer.tsx");
  assert.doesNotMatch(controls, /mushaf-accent-theme/);
  assert.doesNotMatch(controls, /الزمردي/);
  assert.doesNotMatch(controls, /onAccentThemeChange/);
  assert.doesNotMatch(controls, /EMERALD/);
  const settings = read("src/features/mushaf-madinah/MushafSettingsSheet.tsx");
  assert.doesNotMatch(settings, /onAccentTheme/);
  assert.doesNotMatch(settings, /الزمردي/);
  assert.doesNotMatch(settings, /mushaf-settings-accent/);
  const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
  assert.match(reader, /data-mushaf-accent="gold"/);
  assert.doesNotMatch(reader, /useMushafAppearance/);
  assert.doesNotMatch(reader, /onAccentThemeChange/);
  const verified = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
  assert.match(verified, /data-mushaf-accent="gold"/);
  assert.doesNotMatch(verified, /onAccentTheme/);
  assert.doesNotMatch(verified, /accentThemeLocal/);
}

console.log("=== Migration: legacy key removed · gold boot ===");
{
  const boot = read("index.html");
  assert.match(boot, /ssunnah-mushaf-accent-theme-v1/);
  assert.match(boot, /removeItem\("ssunnah-mushaf-accent-theme-v1"\)/);
  assert.match(boot, /data-mushaf-accent", "gold"/);
  assert.match(boot, /2-gold-only/);
  assert.doesNotMatch(boot, /mushafAccent\s*=\s*"emerald"/);
  const prefs = read("src/lib/mushaf-v2/accent-prefs.ts");
  assert.match(prefs, /migrateMushafAccentStorageOnce/);
  assert.match(prefs, /removeItem\(MUSHAF_ACCENT_STORAGE_KEY_LEGACY\)/);
  assert.doesNotMatch(prefs, /localStorage\.setItem\(MUSHAF_ACCENT_STORAGE_KEY/);
  const themeMod = read("src/lib/mushaf-v2/mushaf-appearance-theme.ts");
  assert.doesNotMatch(themeMod, /\bEMERALD\b/);
  assert.doesNotMatch(themeMod, /"emerald"/);
  const provider = read("src/lib/mushaf-v2/MushafAppearanceProvider.tsx");
  assert.match(provider, /applyMushafAccentTheme\("GOLD"\)/);
  assert.doesNotMatch(provider, /useState<MushafAppearanceTheme>/);
  assert.doesNotMatch(provider, /saveMushafAccentTheme\(next\)/);
}

console.log("=== لا مساس بالنص/QPC ===");
{
  const page = read("src/features/mushaf-reader/MushafPage.tsx");
  assert.doesNotMatch(page, /replace\(|mutateAyah|editGlyph|OCR/);
  assert.match(page, /MushafOpeningSpreadLayout/);
}

console.log("mushaf-dual-appearance-theme-gate.test.ts: ok (single-gold)");
