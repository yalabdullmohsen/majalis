/**
 * بوابة: ذهب علامات الآيات المطبعي (Printed Mushaf Gold) — هادئ عسلي مائل للبني.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-verse-marker-printed-gold-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-reader/mushaf-reader.css"), "utf8");
const tokens = readFileSync(
  resolve(root, "src/features/mushaf-reader/mushaf-verse-marker-tokens.ts"),
  "utf8",
);

assert.match(tokens, /mushafVerseMarkerGold\s*=\s*"#A3864D"/);
assert.match(tokens, /mushafVerseMarkerBorder\s*=\s*"#8A7042"/);
assert.match(tokens, /mushafVerseMarkerText\s*=\s*"#6B5530"/);

assert.match(css, /--mushaf-verse-marker-gold:\s*#a3864d/i);
assert.match(css, /--mushaf-verse-marker-border:\s*#8a7042/i);
assert.match(css, /--mushaf-verse-marker-text:\s*#6b5530/i);

assert.match(css, /\.nm-ayah-mark\s*\{[^}]*border:[^;]*var\(--mushaf-verse-marker-border\)/s);
assert.match(css, /\.nm-ayah-mark\s*\{[^}]*color:\s*var\(--mushaf-verse-marker-text\)/s);
assert.match(css, /--mushaf-surah-frame-accent:\s*var\(--mushaf-verse-marker-gold\)/);
assert.match(css, /--mushaf-surah-frame-ornament:\s*var\(--mushaf-verse-marker-border\)/);

/* لا تراجع إلى ذهب لامع/أصفر فاقع شائع */
assert.doesNotMatch(css, /--mushaf-verse-marker-gold:\s*#(c9a227|ffd700|f5c542|e8b923)/i);

/* النص القرآني يبقى عبر توكن الحبر — لا يُربط بذهب العلامة */
assert.match(css, /--mushaf-text-color:\s*var\(--mushaf-ink-light\)/);
assert.match(css, /--nm-ink:\s*var\(--mushaf-text-color\)/);

console.log("mushaf-verse-marker-printed-gold-gate.test.ts: ok");
