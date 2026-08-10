/**
 * بوابة: البحث يعرض خيارات ولا ينتقل تلقائياً للمصحف.
 * تشغيل: node --import tsx src/lib/__tests__/search-no-autonav.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const searchView = readFileSync(resolve(root, "pages/account/ui/SearchView.tsx"), "utf8");
assert.doesNotMatch(searchView, /navigate\(quick\.href\)/, "SearchView لا ينتقل تلقائياً");
assert.doesNotMatch(searchView, /\bparseQuickNav\b/, "SearchView بلا parseQuickNav للانتقال");

const modal = readFileSync(resolve(root, "components/GlobalSearchModal.tsx"), "utf8");
assert.doesNotMatch(modal, /navigate\(res\.quickNavHref\)/, "البحث الشامل لا ينتقل تلقائياً");
assert.doesNotMatch(modal, /if\s*\(\s*res\.quickNavHref\s*\)/, "بلا فرع quickNavHref");

const appSearch = readFileSync(resolve(root, "features/search/app-search.ts"), "utf8");
assert.doesNotMatch(appSearch, /quickNavHref:\s*quick\.href/, "runAppSearch لا يفرض انتقالاً");
assert.match(appSearch, /انتقال سريع/, "اختصار المصحف يبقى خياراً في القائمة");

console.log("search-no-autonav.test.ts: ok");
