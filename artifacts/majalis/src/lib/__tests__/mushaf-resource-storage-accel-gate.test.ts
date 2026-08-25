/**
 * بوابة: مصحف resource-gate + تخزين ذري/مذكّر.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-resource-storage-accel-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const gate = read("src/features/mushaf-madinah/useMushafResourceGate.ts");
const reader = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
const fit = read("src/features/mushaf-madinah/useMushafPageFontFit.ts");
const safe = read("src/lib/safe-json.ts");
const native = read("src/lib/native-storage.ts");
const bookmarks = read("src/lib/local-bookmarks.ts");
const lastPage = read("src/lib/quran-last-page.ts");
const myBm = read("src/lib/quran-my-bookmarks.ts");
const search = read("src/features/search/unified-local.ts");

assert.match(gate, /isFontLoaded/);
assert.match(gate, /isPageDataReady/);
assert.match(gate, /allowOffscreenPrefetch/);
assert.match(reader, /useMushafResourceGate/);
assert.match(reader, /allowOffscreenPrefetch && page/);
assert.match(reader, /canMountPage && layout/);
assert.match(fit, /applyGeometrySizeHint/);
assert.match(fit, /if \(!width\)/);

assert.match(safe, /writeLocalJsonAtomic/);
assert.match(safe, /recoverLocalJsonTmp/);
assert.match(native, /Promise\.all/);
assert.match(bookmarks, /memIndex/);
assert.match(bookmarks, /writeLocalJson/);
assert.match(lastPage, /memLastPage/);
assert.match(myBm, /writeLocalJsonAtomic/);
assert.match(myBm, /memPageIndex/);
assert.match(search, /let cache: IndexPayload \| null = null/);

console.log("mushaf-resource-storage-accel-gate.test.ts: ok");
