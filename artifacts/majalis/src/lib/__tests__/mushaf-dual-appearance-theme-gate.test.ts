/**
 * Mushaf Dual Appearance — EMERALD | GOLD على ص١…٦٠٤
 * Run: node --import tsx src/lib/__tests__/mushaf-dual-appearance-theme-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MUSHAF_ACCENT_DEFAULT,
  MUSHAF_ACCENT_STORAGE_KEY,
  mushafAppearanceThemeLabel,
  themeToAccentAttr,
} from "../../lib/mushaf-v2/mushaf-appearance-theme";
import { QURAN_EXPERIENCE_NEXT } from "../../lib/mushaf-v2/flags";
import {
  mushafEmeraldPrimary,
  mushafVerseMarkerFill,
  quranGold,
} from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== Feature flag + contract ===");
assert.equal(QURAN_EXPERIENCE_NEXT.dualAppearanceThemes, true);
assert.equal(MUSHAF_ACCENT_DEFAULT, "EMERALD");
assert.equal(MUSHAF_ACCENT_STORAGE_KEY, "ssunnah-mushaf-accent-theme-v1");
assert.equal(themeToAccentAttr("EMERALD"), "emerald");
assert.equal(themeToAccentAttr("GOLD"), "gold");
assert.equal(mushafAppearanceThemeLabel("EMERALD"), "الزمردي");
assert.equal(mushafAppearanceThemeLabel("GOLD"), "الذهبي");
assert.ok(existsSync(resolve(majalisRoot, "src/lib/mushaf-v2/accent-prefs.ts")));
assert.ok(existsSync(resolve(majalisRoot, "src/lib/mushaf-v2/mushaf-appearance-theme.ts")));

console.log("=== Tokens: emerald default · gold palette preserved ===");
assert.equal(mushafEmeraldPrimary.toLowerCase(), "#0e7a6b");
assert.equal(quranGold.toLowerCase(), "#c9a82e");
assert.equal(mushafVerseMarkerFill.toLowerCase(), "#c9a82e");

console.log("=== CSS accent contract ===");
{
  const css = read("src/features/mushaf-reader/mushaf-reader.css");
  assert.match(css, /--mushaf-accent-primary:\s*#0e7a6b/i);
  assert.match(css, /--mushaf-marker-background:\s*var\(--mushaf-accent-primary\)/);
  assert.match(css, /--mushaf-verse-marker-fill:\s*var\(--mushaf-marker-background\)/);
  assert.match(css, /\[data-mushaf-accent="gold"\]/);
  assert.match(css, /--mushaf-ayah-mark-font-size:\s*0\.62em/);
  assert.match(css, /--mushaf-ayah-mark-number-size:\s*1\.28em/);
  assert.match(css, /\.nm-ayah-mark\s*\{[^}]*font-size:\s*var\(--mushaf-ayah-mark-font-size/s);
  assert.match(css, /\.nm-ayah-mark__glyph\s*\{[^}]*font-size:\s*var\(--mushaf-ayah-mark-number-size/s);
  assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
  assert.match(css, /html\.dark \.nm-root\[data-mushaf-accent="gold"\]/);
  assert.match(css, /--mushaf-accent-strong:/);
  assert.match(css, /--mushaf-accent-soft:/);
  assert.doesNotMatch(css, /transform:\s*scale\(/);
}

console.log("=== Opening inherits accent (no forced turquoise split) ===");
{
  const chrome = read("src/styles/reader-page-chrome.css");
  assert.doesNotMatch(
    chrome,
    /\.nm-page--opening[\s\S]{0,400}--mushaf-verse-marker-fill:\s*var\(--mushaf-opening-marker-fill\)/,
  );
  assert.match(chrome, /\.nm-page--opening \.nm-ayah-mark[\s\S]{0,200}mushaf-marker-background/);
  assert.match(chrome, /align-content:\s*center/);
}

console.log("=== Wiring: NewMushafReader + Controls + Settings ===");
{
  const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
  assert.match(reader, /data-mushaf-accent/);
  assert.match(reader, /applyAccentTheme|setAccentTheme/);
  const controls = read("src/features/mushaf-reader/MushafControlsLayer.tsx");
  assert.match(controls, /mushaf-accent-theme/);
  assert.match(controls, /الزمردي|mushafAppearanceThemeLabel/);
  assert.match(controls, /aria-checked/);
  const settings = read("src/features/mushaf-madinah/MushafSettingsSheet.tsx");
  assert.match(settings, /onAccentTheme/);
  const repo = read("src/lib/mushaf-v2/QuranSettingsRepository.ts");
  assert.match(repo, /getAccentTheme|setAccentTheme|applyAccentTheme/);
  assert.match(repo, /MUSHAF_ACCENT_STORAGE_KEY|accent-prefs|loadMushafAccentTheme/);
  const prefs = read("src/lib/mushaf-v2/accent-prefs.ts");
  assert.match(prefs, /MUSHAF_ACCENT_STORAGE_KEY/);
  const themeMod = read("src/lib/mushaf-v2/mushaf-appearance-theme.ts");
  assert.match(themeMod, /ssunnah-mushaf-accent-theme-v1/);
}

console.log("=== لا مساس بالنص/QPC ===");
{
  const page = read("src/features/mushaf-reader/MushafPage.tsx");
  assert.doesNotMatch(page, /replace\(|mutateAyah|editGlyph|OCR/);
  assert.match(page, /MushafOpeningSpreadLayout/);
}

console.log("mushaf-dual-appearance-theme-gate.test.ts: ok");
