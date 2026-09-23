/**
 * Mushaf Appearance PR-1 — Provider + persistence + boot hydration gate.
 * Run: node --import tsx src/lib/__tests__/mushaf-appearance-pr1-provider-persistence-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

console.log("=== Evidence doc ===");
{
  const doc = resolve(repoRoot, "docs/mushaf/MUSHAF_APPEARANCE_PR1_ROOT_CAUSE.md");
  assert.ok(existsSync(doc), "PR-1 root-cause doc missing");
  const text = readRepo("docs/mushaf/MUSHAF_APPEARANCE_PR1_ROOT_CAUSE.md");
  assert.match(text, /ROOT_CAUSE_CONFIRMED/);
  assert.match(text, /MULTIPLE_PROVIDERS/);
  assert.match(text, /ssunnah-mushaf-accent-theme-v1/);
}

console.log("=== Boot hydration (index.html) ===");
{
  const html = read("index.html");
  assert.match(html, /ssunnah-mushaf-accent-theme-v1/);
  assert.match(html, /data-mushaf-accent/);
  assert.match(html, /mushafAccent\s*=\s*"gold"|mushafAccent = "gold"/);
}

console.log("=== Provider sync apply on init ===");
{
  const provider = read("src/lib/mushaf-v2/MushafAppearanceProvider.tsx");
  assert.match(provider, /function readInitialTheme/);
  assert.match(provider, /applyMushafAccentTheme\(initial\)/);
  assert.match(provider, /useState<MushafAppearanceTheme>\(readInitialTheme\)/);
  assert.match(provider, /saveMushafAccentTheme\(next\)/);
  assert.doesNotMatch(
    provider,
    /useState\(\(\) =>\s*QURAN_EXPERIENCE_NEXT\.dualAppearanceThemes \? loadMushafAccentTheme\(\) : "EMERALD"\s*,?\s*\)/,
  );
}

console.log("=== Live path: single Provider consumer ===");
{
  const page = read("src/pages/quran/MushafReaderPage.tsx");
  assert.match(page, /MushafAppearanceProvider/);
  assert.match(page, /NewMushafReader/);
  assert.doesNotMatch(page, /VerifiedMushafReader/);
  const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
  assert.match(reader, /useMushafAppearance/);
  assert.match(reader, /data-mushaf-accent=\{accentAttr\}/);
  assert.doesNotMatch(reader, /accentThemeLocal|setAccentThemeLocal/);
}

console.log("=== Archive reader: no save-skipping local setter ===");
{
  const verified = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
  assert.match(verified, /QuranSettingsRepository\.setAccentTheme/);
  assert.match(verified, /QuranSettingsRepository\.applyAccentTheme/);
  assert.doesNotMatch(
    verified,
    /setAccentTheme = appearanceCtx\?\.setTheme \?\? setAccentThemeLocal/,
  );
}

console.log("=== Persistence module single key ===");
{
  const prefs = read("src/lib/mushaf-v2/accent-prefs.ts");
  assert.match(prefs, /MUSHAF_ACCENT_STORAGE_KEY/);
  assert.match(prefs, /localStorage\.setItem\(MUSHAF_ACCENT_STORAGE_KEY/);
  assert.match(prefs, /applyMushafAccentTheme/);
  const theme = read("src/lib/mushaf-v2/mushaf-appearance-theme.ts");
  assert.match(theme, /ssunnah-mushaf-accent-theme-v1/);
  assert.match(theme, /EMERALD|GOLD/);
}

console.log("mushaf-appearance-pr1-provider-persistence-gate.test.ts: ok");
