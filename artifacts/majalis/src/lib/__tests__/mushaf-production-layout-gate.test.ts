/**
 * بوابة: المصحف الإنتاجي NewMushafReader — عزل التخطيط ومنع قفز الصفحة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-production-layout-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/pages/quran/MushafReaderPage.tsx");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const pager = read("src/features/mushaf-reader/useMushafPager.ts");
const immersive = read("src/lib/immersive-chrome.ts");

assert.match(page, /NewMushafReader/);
assert.doesNotMatch(page, /VerifiedMushafReader/);
assert.match(immersive, /p === "\/mushaf"/);

assert.match(css, /overflow-anchor:\s*none/);
assert.match(css, /--reader-bottom-stack/);
assert.match(css, /\[data-ayah-bar="1"\]/);
assert.match(css, /\[data-audio-dock="1"\]/);
assert.match(css, /\.nm-verse-menu/);
assert.match(css, /\.nm-ayah-sel/);
assert.doesNotMatch(css, /mix-blend-mode:\s*multiply/);

assert.match(reader, /data-ayah-bar=/);
assert.match(reader, /data-audio-dock=/);
assert.match(reader, /nm-root/);
assert.doesNotMatch(reader, /scrollIntoView/);
assert.doesNotMatch(reader, /\.scrollTo\(/);

assert.match(pager, /translate3d/);
assert.doesNotMatch(pager, /scrollIntoView/);
assert.doesNotMatch(pager, /window\.scrollTo/);

console.log("mushaf-production-layout-gate.test.ts: ok");
