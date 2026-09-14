/**
 * بوابة محدّثة: ذهب/أصفر علامات الآيات المطبعي (Warm Yellow).
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
} from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-reader/mushaf-reader.css"), "utf8");
const tokens = readFileSync(
  resolve(root, "src/features/mushaf-reader/mushaf-warm-yellow-tokens.ts"),
  "utf8",
);

assert.match(tokens, new RegExp(`mushafVerseMarkerFill\\s*=\\s*"${mushafVerseMarkerFill}"`));
assert.match(tokens, new RegExp(`mushafVerseMarkerBorder\\s*=\\s*"${mushafVerseMarkerBorder}"`));
assert.match(tokens, new RegExp(`mushafVerseMarkerNumber\\s*=\\s*"${mushafVerseMarkerNumber}"`));

assert.match(css, new RegExp(`--mushaf-verse-marker-fill:\\s*${mushafVerseMarkerFill}`, "i"));
assert.match(css, new RegExp(`--mushaf-verse-marker-border:\\s*${mushafVerseMarkerBorder}`, "i"));
assert.match(css, new RegExp(`--mushaf-verse-marker-number:\\s*${mushafVerseMarkerNumber}`, "i"));
assert.match(css, /\.nm-ayah-mark\s*\{[^}]*border:[^;]*var\(--mushaf-verse-marker-border\)/s);
assert.match(css, /\.nm-ayah-mark\s*\{[^}]*color:\s*var\(--mushaf-verse-marker-number\)/s);
assert.match(css, /--mushaf-surah-frame-accent:\s*var\(--mushaf-printed-gold\)/);
assert.match(css, /--mushaf-surah-frame-ornament:\s*var\(--mushaf-printed-gold-border\)/);
assert.doesNotMatch(css, /--mushaf-verse-marker-fill:\s*#(c9a227|ffd700|a3864d)/i);
assert.match(css, /--mushaf-text-color:\s*var\(--mushaf-ink-primary\)/);
assert.match(css, /--nm-ink:\s*var\(--mushaf-text-color\)/);
assert.match(css, /--mushaf-ayah-mark-size:\s*0\.98em/);

console.log("mushaf-verse-marker-printed-gold-gate.test.ts: ok");
