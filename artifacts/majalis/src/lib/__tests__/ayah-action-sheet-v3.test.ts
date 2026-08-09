/**
 * بوابة شيت الآية v3.
 * تشغيل: node --import tsx src/lib/__tests__/ayah-action-sheet-v3.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const tsx = readFileSync(join(root, "components/quran/PageAyahActionSheet.tsx"), "utf8");
const css = readFileSync(join(root, "styles/components/ayah-action-sheet.css"), "utf8");

assert.match(tsx, /aas-v3__actions/);
assert.match(tsx, /تسميع هذه السورة|recitation-test-ai\?surah=/);
assert.match(tsx, /aas-v3__header/);
assert.match(tsx, /aas-v3__close/);
assert.match(tsx, /shareAyahAsText/);
assert.match(tsx, /moreOpen/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /--color-mushaf-/);
assert.match(css, /min-height:\s*44px/);

console.log("ayah-action-sheet-v3.test.ts: ok");
