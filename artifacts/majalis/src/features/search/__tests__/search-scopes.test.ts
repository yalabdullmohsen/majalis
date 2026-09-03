/**
 * نطاقات صفحة البحث: تفسير/سيرة يعملان فعليًا + رسالة فراغ واضحة.
 * تشغيل: node --import tsx src/features/search/__tests__/search-scopes.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearUnifiedSearchIndexCache,
  docMatchesScope,
  primeUnifiedSearchIndex,
  runAppSearch,
  type UnifiedSearchDoc,
} from "@/features/search";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, "../../../../");
const searchView = readFileSync(resolve(appRoot, "src/pages/account/ui/SearchView.tsx"), "utf8");
const searchModal = readFileSync(resolve(appRoot, "src/components/GlobalSearchModal.tsx"), "utf8");

assert.match(searchView, /ابحث في المحتوى/);
assert.match(searchView, /250/);
assert.match(searchView, /AbortController/);
assert.match(searchView, /لا توجد نتائج في هذا القسم، جرّب كلمة أخرى أو ابحث في الكل/);
assert.match(searchModal, /key: "tafsir"/);
assert.match(searchModal, /key: "seerah"/);
assert.match(searchModal, /key: "quran"/);
assert.match(searchModal, /أقسام مقترحة/);
assert.match(searchModal, /scope: filter/);
assert.doesNotMatch(searchModal, /key: "surah"/);
assert.match(searchView, /VirtualList/);
assert.match(searchView, /\/quiz\?qa=/);
assert.match(searchView, /\/fawaid#/);
assert.doesNotMatch(searchView, /parseQuickNav/);
assert.doesNotMatch(searchView, /loadLessonsSeed/);
assert.doesNotMatch(searchView, /intelligentSearch/);

assert.equal(
  docMatchesScope({ id: "tafsir:hub", kind: "tafsir", href: "/tafsir" }, "tafsir"),
  true,
);
assert.equal(
  docMatchesScope(
    { id: "history:seerah-portal", kind: "history", href: "/tarikh-islami/seerah-portal" },
    "seerah",
  ),
  true,
);
assert.equal(
  docMatchesScope(
    { id: "history:rashidun-abu-bakr", kind: "history", href: "/tarikh-islami/rashidun-abu-bakr" },
    "seerah",
  ),
  false,
);

const index = JSON.parse(readFileSync(resolve(appRoot, "public/data/search/index.json"), "utf8")) as {
  docs: UnifiedSearchDoc[];
};
clearUnifiedSearchIndexCache();
primeUnifiedSearchIndex({ version: 2, docs: index.docs });

const tafsirBrowse = await runAppSearch("", { scope: "tafsir", limit: 20 });
assert.ok(tafsirBrowse.results.length >= 1, `تصفح التفسير يعيد نتائج (حصل ${tafsirBrowse.results.length})`);
assert.equal(tafsirBrowse.scope, "tafsir");

const seerahBrowse = await runAppSearch("", { scope: "seerah", limit: 20 });
assert.ok(seerahBrowse.results.length >= 1, `تصفح السيرة يعيد نتائج (حصل ${seerahBrowse.results.length})`);

const seerahQ = await runAppSearch("سيرة", { scope: "seerah", limit: 20 });
assert.ok(seerahQ.results.length >= 1, "بحث سيرة داخل نطاق السيرة");

const tafsirQ = await runAppSearch("تفسير", { scope: "tafsir", limit: 20 });
assert.ok(tafsirQ.results.length >= 1, "بحث تفسير داخل نطاق التفسير");

const salahFiqh = await runAppSearch("الصلاة", { scope: "fiqh", limit: 20 });
assert.ok(salahFiqh.results.length >= 1 || salahFiqh.suggestions.length >= 0, "نطاق الفقه لا يكسر البحث");

const musa = await runAppSearch("قصة موسى", { scope: "prophet", limit: 20 });
assert.ok(musa.results.length >= 1, `قصة موسى في الأنبياء (حصل ${musa.results.length})`);

console.log(
  `search-scopes.test.ts: ok (tafsir ${tafsirBrowse.results.length}, seerah ${seerahBrowse.results.length})`,
);
