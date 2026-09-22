/**
 * بوابة محدّثة: لوحة ذهب مطبعية محفوظة + Accent Theme يختار التعبئة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-verse-marker-printed-gold-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mushafVerseMarkerFill,
  mushafVerseMarkerBorder,
  mushafVerseMarkerNumber,
  quranGold,
} from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-reader/mushaf-reader.css"), "utf8");
const tokens = readFileSync(
  resolve(root, "src/features/mushaf-reader/mushaf-warm-yellow-tokens.ts"),
  "utf8",
);

assert.match(tokens, /mushafVerseMarkerFill\s*=\s*quranGold/);
assert.match(tokens, /mushafVerseMarkerBorder\s*=\s*quranGoldDeep/);
assert.match(tokens, /mushafVerseMarkerNumber\s*=\s*quranGoldInk/);
assert.equal(mushafVerseMarkerFill.toLowerCase(), "#c9a82e");
assert.equal(mushafVerseMarkerBorder.toLowerCase(), "#b89620");
assert.equal(mushafVerseMarkerNumber.toLowerCase(), "#5f4814");
assert.equal(quranGold.toLowerCase(), "#c9a82e");

assert.match(css, /--quran-gold:\s*#c9a82e/i);
assert.match(css, /--mushaf-printed-gold:\s*#c9a82e/i);
assert.match(css, /--mushaf-verse-marker-fill:\s*var\(--mushaf-marker-background\)/);
assert.match(css, /\[data-mushaf-accent="gold"\][\s\S]{0,500}--mushaf-marker-background:\s*var\(--quran-gold\)/);
assert.match(css, /\.nm-ayah-mark\s*\{[^}]*border:[^;]*var\(--mushaf-verse-marker-border\)/s);
assert.match(css, /\.nm-ayah-mark\s*\{[^}]*color:\s*var\(--mushaf-verse-marker-number\)/s);
assert.match(css, /--mushaf-text-color:\s*var\(--mushaf-ink-primary\)/);
assert.match(css, /--nm-ink:\s*var\(--mushaf-text-color\)/);
assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
assert.doesNotMatch(css, /--mushaf-verse-marker-fill:\s*#(dcb424|c9a227|ffd700|a3864d)/i);

console.log("mushaf-verse-marker-printed-gold-gate.test.ts: ok");
