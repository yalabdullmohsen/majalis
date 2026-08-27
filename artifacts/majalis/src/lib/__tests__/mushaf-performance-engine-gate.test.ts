/**
 * بوابة محرك أداء المصحف — prefetch صوتي، ضغط مطوّل للتفسير، بطاقة مشاركة، sepia.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-performance-engine-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const reader = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
const line = read("src/features/mushaf-madinah/MushafAyahLine.tsx");
const settings = read("src/features/mushaf-madinah/MushafSettingsSheet.tsx");
const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const prefetch = read("src/features/mushaf-madinah/prefetch-adjacent-audio.ts");
const share = read("src/lib/share-ayah.ts");
const tafsir = read("src/features/mushaf-madinah/TafsirTabPanel.tsx");

assert.match(prefetch, /prefetchAdjacentPageAudio/);
assert.match(prefetch, /listAyahAudioUrls/);
assert.match(reader, /prefetchAdjacentPageAudio/);
assert.match(reader, /onLongPressVerse/);
assert.match(reader, /onShareImage/);
assert.match(reader, /shareAyahAsImage/);
assert.match(line, /onLongPressVerse/);
assert.match(line, /LONG_PRESS_MS/);
assert.match(settings, /sepia/);
assert.match(settings, /بيج دافئ/);
assert.match(css, /data-mushaf-theme="sepia"/);
assert.match(share, /#fdfbf7/);
assert.match(share, /#1e7e52/);
assert.match(tafsir, /onShareImage/);
assert.match(tafsir, /بطاقة/);

console.log("mushaf-performance-engine-gate.test.ts: ok");
