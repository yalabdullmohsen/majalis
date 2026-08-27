/**
 * بوابة — واجهة الإعجاز العلمي: بلا فلاتر مكدّسة ولا مشاركة متضخمة.
 * Run: node --import tsx src/lib/__tests__/miracles-ui-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/views/MiraclesPage.tsx");
const fab = read("src/components/FloatingBackButton.tsx");
const share = read("src/components/ShareFaida.tsx");

assert.doesNotMatch(page, /mk-cats-bar/);
assert.doesNotMatch(page, /ShareButtons/);
assert.doesNotMatch(page, /twh-share/);
assert.doesNotMatch(page, /FilterBottomSheet/);
assert.match(page, /mk-search-bar/);
assert.match(page, /ShareFaida[\s\S]*variant="icons"/);
assert.match(page, /mk-card__footer/);

assert.match(fab, /if \(deepScroll\) return null/);
assert.doesNotMatch(fab, /ChevronUp/);

assert.match(share, /variant === "icons"/);
assert.match(share, /share-faida--icons/);

console.log("miracles-ui-gate: ok");
