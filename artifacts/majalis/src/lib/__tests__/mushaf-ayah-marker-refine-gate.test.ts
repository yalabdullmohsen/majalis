/**
 * بوابة تنعيم فاصل الآية: وردة 8 بتلات ناعمة + رقم أوضح داخل نفس الصندوق 1.15em.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-ayah-marker-refine-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const markerPath = resolve(majalisRoot, "src/features/mushaf-reader/MushafAyahMarker.tsx");
assert.ok(existsSync(markerPath), "MushafAyahMarker موجود");

const marker = read("src/features/mushaf-reader/MushafAyahMarker.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const verse = read("src/features/mushaf-reader/MushafVerseLayer.tsx");

/* مكوّن واحد فقط */
assert.match(marker, /data-component="MushafAyahMarker"/);
assert.match(marker, /data-marker="ayah-rosette-v2"/);
assert.match(verse, /MushafAyahMarker/);
assert.doesNotMatch(verse, /OpeningAyahMarker|GreenAyahMarker|GoldAyahMarker|LegacyAyahMarker|CompactAyahMarker/);
assert.doesNotMatch(marker, /<svg/i);
assert.doesNotMatch(marker, /#[0-9a-fA-F]{3,8}/);
assert.doesNotMatch(marker, /scale\(/);

/* هندسة خارجية ثابتة */
assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
assert.match(css, /--mushaf-ayah-mark-font-size:\s*0\.62em/);
assert.match(css, /--mushaf-ayah-mark-number-size:\s*1\.40em/);

/* Tokens الفاصل */
assert.match(css, /--mushaf-ayah-marker-fill:\s*var\(--mushaf-verse-marker-fill\)/);
assert.match(css, /--mushaf-ayah-marker-stroke:\s*var\(--mushaf-verse-marker-border\)/);
assert.match(css, /--mushaf-ayah-marker-number:\s*var\(--mushaf-verse-marker-number\)/);
assert.match(css, /--mushaf-ayah-marker-size:\s*var\(--mushaf-ayah-mark-size\)/);
assert.match(css, /--mushaf-ayah-marker-inner-size:\s*var\(--mushaf-ayah-mark-number-size\)/);

/* وردة ناعمة: clip-path موجود · بلا طرف 2٪ الشائك · بلا أخضر داخل الفاصل */
assert.match(css, /SunnahVerseRosette/);
assert.match(css, /\.nm-ayah-mark[\s\S]*?clip-path:\s*polygon/);
assert.match(css, /8 بتلات|فصوص ناعمة/);
assert.doesNotMatch(css, /\.nm-ayah-mark[\s\S]*?50%\s*2%/);
assert.doesNotMatch(css, /\.nm-ayah-mark[\s\S]*?50%\s*6%/);
assert.match(css, /\.nm-ayah-mark[\s\S]*?50\.0%\s*10\.0%/);
assert.doesNotMatch(
  css,
  /\.nm-ayah-mark\s*\{[^}]*(?:#1f4f3c|#0[Ee]7[Aa]6[Bb]|green|emerald)/i,
);

/* الرقم أوضح · وزن متوسط · tabular إن وُجد */
assert.match(css, /\.nm-ayah-mark__glyph[\s\S]*?font-variant-numeric:\s*tabular-nums/);
assert.match(css, /\.nm-ayah-mark\s*\{[^}]*font-weight:\s*700/s);
assert.doesNotMatch(css, /\.nm-ayah-mark\s*\{[^}]*font-weight:\s*800/s);
assert.doesNotMatch(css, /\.nm-ayah-mark[\s\S]{0,400}transform:\s*scale\(/);

/* الزخرفة مخفية عن AT — الرقم من glyph بيانات الآية */
assert.match(marker, /aria-hidden="true"/);
assert.match(marker, /glyph/);

console.log("mushaf-ayah-marker-refine-gate.test.ts: ok");
