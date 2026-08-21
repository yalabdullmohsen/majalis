/**
 * كاش تخطيط المصحف: بلا وميض عند التقليب، وبلا جلب ٦٠٤ صفحة دفعة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-cache-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { clearDedupePool } from "../lru-cache";
import {
  getAyahTextFromLayout,
  getCachedMushafPage,
  loadMushafPage,
  prefetchMushafPage,
  resetMushafPageCachesForTests,
} from "../quran-data/qpc-page-data";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const publicRoot = resolve(root, "public");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const dataSrc = read("src/lib/quran-data/qpc-page-data.ts");
const viewport = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");

assert.match(dataSrc, /LAYOUT_CACHE_MAX\s*=\s*12/);
assert.match(dataSrc, /getCachedMushafPage/);
assert.match(dataSrc, /prefetchMushafPage[\s\S]{0,500}loadMushafPage/);
assert.doesNotMatch(dataSrc, /for\s*\(\s*let\s+n\s*=\s*1;\s*n\s*<=\s*604/);
assert.match(viewport, /setLayout\(getCachedMushafPage\(page\)\)/);
assert.match(viewport, /getCachedMushafPage\(pageNumber\)/);
assert.doesNotMatch(
  viewport,
  /setError\(null\);\s*setLayout\(null\);/,
  "لا تُصفَّر الصفحة إن وُجد تخطيط في الكاش",
);

const origFetch = globalThis.fetch;
const fetchedPageFiles: string[] = [];

function installFetchMock(): void {
  fetchedPageFiles.length = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.pathname
          : input instanceof Request
            ? new URL(input.url, "https://local.test").pathname
            : String(input);
    const path = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0] ?? url;
    const pageMatch = path.match(/page-(\d{3})\.json$/);
    if (pageMatch) fetchedPageFiles.push(pageMatch[1]!);
    const file = resolve(publicRoot, path.replace(/^\//, ""));
    if (!existsSync(file)) return new Response("missing", { status: 404 });
    return new Response(readFileSync(file), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

function uniquePages(): string[] {
  return [...new Set(fetchedPageFiles)];
}

try {
  installFetchMock();
  resetMushafPageCachesForTests();
  clearDedupePool();

  assert.equal(getCachedMushafPage(5), null);

  const page5 = await loadMushafPage(5);
  assert.equal(page5.pageNumber, 5);
  assert.ok(page5.ayahLineCount > 0, "صفحة ٥ لها أسطر آيات");
  assert.equal(getCachedMushafPage(5), page5, "الكاش يعيد نفس التخطيط");
  const firstFetchCount = fetchedPageFiles.length;
  assert.ok(firstFetchCount >= 1 && firstFetchCount <= 3, `جلب أولي محدود، وُجد ${firstFetchCount}`);
  assert.ok(uniquePages().includes("005"), "جُلبت صفحة ٥");
  assert.ok(!uniquePages().includes("604"), "لم تُجلب الصفحة ٦٠٤");

  const page5again = await loadMushafPage(5);
  assert.equal(page5again, page5);
  assert.equal(fetchedPageFiles.length, firstFetchCount, "الاستدعاء الثاني من الكاش بلا شبكة");

  prefetchMushafPage(4);
  prefetchMushafPage(6);
  const [page6, page4] = await Promise.all([loadMushafPage(6), loadMushafPage(4)]);
  assert.equal(page6.pageNumber, 6);
  assert.equal(page4.pageNumber, 4);
  assert.ok(getCachedMushafPage(6), "prefetch يبني التخطيط لا JSON الخام فقط");
  assert.ok(getCachedMushafPage(4), "الصفحة السابقة جاهزة في الكاش");

  prefetchMushafPage(5);
  prefetchMushafPage(7);
  await loadMushafPage(7);

  const unique = uniquePages();
  assert.ok(unique.length <= 8, `تقليب ±١ لا يجلب ٦٠٤؛ جُلب ${unique.length}: ${unique.join(",")}`);
  assert.ok(!unique.includes("604"));
  assert.ok(!unique.includes("001"));

  prefetchMushafPage(0);
  prefetchMushafPage(605);
  prefetchMushafPage(-1);
  await Promise.resolve();
  assert.equal(uniquePages().length, unique.length, "prefetch خارج ١–٦٠٤ لا يطلق جلبًا");

  const fatiha = await loadMushafPage(1);
  const ayah1 = getAyahTextFromLayout(fatiha, "1:1");
  assert.ok(ayah1.length > 5, "نص الفاتحة ١ من التخطيط المخزّن غير فارغ");

  resetMushafPageCachesForTests();
  assert.equal(getCachedMushafPage(5), null, "التفريغ للاختبار يمسح الكاش");
} finally {
  globalThis.fetch = origFetch;
  resetMushafPageCachesForTests();
  clearDedupePool();
}

console.log("mushaf-page-cache-gate.test.ts: ok");
