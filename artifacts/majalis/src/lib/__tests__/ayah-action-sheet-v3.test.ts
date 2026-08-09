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
const reciter = readFileSync(join(root, "components/quran/ReciterPickerSheet.tsx"), "utf8");
const fetchSrc = readFileSync(join(root, "features/mushaf/fetch-ayah-content.ts"), "utf8");

assert.match(tsx, /aas-v3__actions/);
assert.match(tsx, /aas-v3__header/);
assert.match(tsx, /aas-v3__nav/);
assert.match(tsx, /shareAyahAsText/);
assert.match(tsx, /moreOpen/);
assert.match(tsx, /panelMode/);
assert.match(tsx, /إعادة المحاولة/);
assert.match(tsx, /نسخ بلا تشكيل/);
assert.match(tsx, /recitation-test-ai\?surah=/);
assert.doesNotMatch(tsx, /aas-v3__close/, "شريط إغلاق أسود أُزيل — المقبض يكفي");
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /--color-mushaf-/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /max-height:\s*min\(70dvh/);
assert.match(css, /position:\s*relative/);
assert.doesNotMatch(css, /\.aas-v3__close\s*\{[^}]*background:\s*var\(--color-mushaf-ink/, "لا خلفية سوداء للإغلاق");
assert.match(reciter, /elevated/);
assert.match(reciter, /ابحث عن قارئ/);
assert.match(fetchSrc, /mj-mushaf-tafsir-sess/);
assert.match(fetchSrc, /TafseerService/);

console.log("ayah-action-sheet-v3.test.ts: ok");
