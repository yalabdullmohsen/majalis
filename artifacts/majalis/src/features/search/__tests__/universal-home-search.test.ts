/**
 * بوابة الوحدة ٧ — البحث الموحّد.
 * تشغيل: node --import tsx src/features/search/__tests__/universal-home-search.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  primeUnifiedSearchIndex,
  clearUnifiedSearchIndexCache,
} from "../unified-local";
import {
  runUniversalSearch,
  UNIVERSAL_DEBOUNCE_MS,
  UNIVERSAL_PREVIEW,
  UNIVERSAL_SECTION_ORDER,
} from "../universal-home-search";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../../../");
const src = resolve(root, "src");

function read(rel: string) {
  return readFileSync(resolve(src, rel), "utf8");
}

assert.equal(UNIVERSAL_DEBOUNCE_MS, 120);
assert.equal(UNIVERSAL_PREVIEW, 3);
assert.deepEqual([...UNIVERSAL_SECTION_ORDER], ["quran", "book", "scholar", "adhkar", "quiz"]);

const indexPath = resolve(root, "public/data/search/index.json");
const payload = JSON.parse(readFileSync(indexPath, "utf8")) as {
  version: number;
  docs: { id: string; kind: string; titleAr: string; href: string; norm: string; meta?: string }[];
};
clearUnifiedSearchIndexCache();
primeUnifiedSearchIndex(payload);
// تسخين JIT قبل القياس
await runUniversalSearch("الصلاة");

{
  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    const res = await runUniversalSearch("البخاري");
    times.push(res.responseMs);
    assert.ok(res.counts.book + res.counts.scholar > 0, "نتائج كتب/علماء");
  }
  const median = [...times].sort((a, b) => a - b)[2]!;
  assert.ok(median < 100, `وسيط استجابة الفهرس ≤100ms (الفعلي ${median.toFixed(1)}ms؛ العينات ${times.map((t) => t.toFixed(0)).join(",")})`);
}

{
  const pageJump = await runUniversalSearch("٢٨٣");
  assert.ok(pageJump.hits.some((h) => h.href.includes("/mushaf/page/283")), "قفز صفحة");
  const ayahJump = await runUniversalSearch("البقرة ٢٥٥");
  assert.ok(
    ayahJump.hits.some((h) => h.href.includes("ayah=2:255") || h.title.includes("٢٥٥")),
    "قفز آية بالاسم",
  );
}

{
  const adhkar = await runUniversalSearch("أذكار الصباح");
  assert.ok(adhkar.counts.adhkar > 0 || adhkar.hits.length > 0, "أذكار");
}

{
  const home = read("pages/account/ui/HomeView.tsx");
  assert.match(home, /HomeUniversalSearch/);
  const comp = read("components/home/HomeUniversalSearch.tsx");
  assert.match(comp, /UNIVERSAL_DEBOUNCE_MS/);
  assert.match(comp, /آخر عمليات البحث/);
  assert.match(comp, /عرض الكل/);
  assert.match(comp, /hidden=\{hidden\}/);
  assert.match(comp, /loadUnifiedSearchIndex/);
  const gsm = read("components/GlobalSearchModal.tsx");
  assert.match(gsm, /DEBOUNCE_MS = 120/);
  // لا استيراد ساكن للفهرس من الرئيسية
  assert.doesNotMatch(home, /from ["']@\/features\/search\/unified-local["']/);
}

clearUnifiedSearchIndexCache();
console.log("universal-home-search.test.ts: ok");
