/**
 * Mushaf Appearance — gold-only migration + boot hydration gate.
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

console.log("=== Evidence doc (optional historical) ===");
{
  const doc = resolve(repoRoot, "docs/mushaf/MUSHAF_SINGLE_GOLD_APPEARANCE.md");
  assert.ok(existsSync(doc), "single-gold appearance doc missing");
  const text = readRepo("docs/mushaf/MUSHAF_SINGLE_GOLD_APPEARANCE.md");
  assert.match(text, /MUSHAF_GOLD_APPEARANCE|GOLD only|ذهبي ثابت/);
}

console.log("=== Boot hydration (index.html) — gold + legacy purge ===");
{
  const html = read("index.html");
  assert.match(html, /removeItem\("ssunnah-mushaf-accent-theme-v1"\)/);
  assert.match(html, /data-mushaf-accent", "gold"/);
  assert.match(html, /2-gold-only/);
  assert.doesNotMatch(html, /mushafAccent\s*=\s*"emerald"/);
}

console.log("=== Provider: migration shell only ===");
{
  const provider = read("src/lib/mushaf-v2/MushafAppearanceProvider.tsx");
  assert.match(provider, /migrateMushafAccentStorageOnce|applyMushafAccentTheme/);
  assert.doesNotMatch(provider, /useState<MushafAppearanceTheme>/);
  assert.doesNotMatch(provider, /saveMushafAccentTheme\(next\)/);
}

console.log("=== Live path: fixed gold attr ===");
{
  const page = read("src/pages/quran/MushafReaderPage.tsx");
  assert.match(page, /MushafAppearanceProvider/);
  assert.match(page, /NewMushafReader/);
  const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
  assert.match(reader, /data-mushaf-accent="gold"/);
  assert.doesNotMatch(reader, /accentThemeLocal|setAccentThemeLocal/);
  assert.doesNotMatch(reader, /onAccentThemeChange/);
}

console.log("=== Persistence: no write of theme choice ===");
{
  const prefs = read("src/lib/mushaf-v2/accent-prefs.ts");
  assert.match(prefs, /MUSHAF_ACCENT_STORAGE_KEY_LEGACY/);
  assert.match(prefs, /removeItem\(MUSHAF_ACCENT_STORAGE_KEY_LEGACY\)/);
  assert.doesNotMatch(prefs, /localStorage\.setItem\(MUSHAF_ACCENT_STORAGE_KEY[^_]/);
  const theme = read("src/lib/mushaf-v2/mushaf-appearance-theme.ts");
  assert.match(theme, /ssunnah-mushaf-accent-theme-v1/);
  assert.doesNotMatch(theme, /\bEMERALD\b/);
  assert.match(theme, /MUSHAF_GOLD_APPEARANCE/);
}

console.log("mushaf-appearance-pr1-provider-persistence-gate.test.ts: ok (gold-only)");
