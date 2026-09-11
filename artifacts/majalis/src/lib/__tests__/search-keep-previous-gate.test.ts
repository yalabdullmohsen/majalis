/**
 * بوابة: صفحة البحث تُبقي النتائج السابقة أثناء إعادة الجلب (بلا وميض هيكل).
 * node --import tsx src/lib/__tests__/search-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = readFileSync(resolve(root, "src/pages/account/ui/SearchView.tsx"), "utf8");

assert.match(
  src,
  /loading\s*&&\s*results\.length\s*===\s*0/,
  "الهيكل فقط عند التحميل بلا نتائج سابقة",
);
assert.doesNotMatch(
  src,
  /\)\s*:\s*loading\s*\?\s*\([\s\S]{0,120}SearchSkeleton/,
  "ممنوع استبدال النتائج بهيكل عند كل loading",
);
assert.match(src, /aria-busy=\{loading/, "aria-busy أثناء تحديث النتائج الظاهرة");

const gsm = readFileSync(resolve(root, "src/components/GlobalSearchModal.tsx"), "utf8");
assert.match(gsm, /loading\s*&&\s*!hasResults/, "البحث الشامل يُبقي النتائج أثناء التحديث");

console.log("search-keep-previous-gate.test.ts: ok");
