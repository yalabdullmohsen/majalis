/**
 * ثبات تخطيط صفحات المصحف — حجم خط موحّد، شبكة ١٥، أنواع صفحات واضحة.
 * يغطي ١٢٦–١٢٨ (مائدة → أنعام) وصفحات عينة أخرى.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-layout-consistency-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mushafUniformFitCacheKey,
  resolveUniformMushafFontSize,
} from "../../features/mushaf-madinah/fitPageFontSize";
import { clearDedupePool } from "../lru-cache";
import {
  loadMushafPage,
  resetMushafPageCachesForTests,
} from "../quran-data/qpc-page-data";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const page = read("src/features/mushaf-madinah/MushafPage.tsx");
const fitHook = read("src/features/mushaf-madinah/useMushafPageFontFit.ts");
const fitAlgo = read("src/features/mushaf-madinah/fitPageFontSize.ts");
const footer = read("src/features/mushaf-madinah/MushafPageFooter.tsx");

assert.match(css, /grid-template-rows:\s*repeat\(15,\s*minmax\(0,\s*1fr\)\)/);
assert.match(css, /--mushaf-page-width:/);
assert.match(css, /--mushaf-top-margin:/);
assert.match(css, /--mushaf-font-size:/);
assert.match(css, /--mushaf-line-height:/);
assert.match(css, /--mushaf-surah-header-height:/);
assert.match(css, /--mushaf-page-number-bottom:/);
assert.match(css, /line-height:\s*var\(--mm-line-height\)/);
assert.doesNotMatch(css, /\.mm-page\[data-page="126"\]/);
assert.doesNotMatch(css, /transform:\s*scale\(/);

assert.match(page, /data-page-type=\{pageType\}/);
assert.match(page, /surah-start/);
assert.match(page, /"lead"/);
assert.match(page, /useMushafPageFontFit/);
assert.match(fitHook, /resolveUniformMushafFontSize/);
assert.match(fitHook, /mushafUniformFitCacheKey/);
assert.match(fitHook, /mushafOpeningFitCacheKey|isMushafOpeningPage/);
assert.doesNotMatch(fitHook, /shrinkUntilFit/);
assert.match(fitHook, /fitPageFontSize\(/);
assert.match(fitAlgo, /uniform-v3\|/);
assert.match(fitAlgo, /opening-v3\|/);
assert.match(fitAlgo, /MUSHAF_FIT_OPENING_MAX_PX/);
assert.match(css, /--mm-ref-open-banner-y:\s*24\.5%/);
assert.match(css, /--mm-ref-open-text-end:\s*78\.5%/);
assert.match(footer, /mm-page-footer__num/);
assert.doesNotMatch(footer, /<svg/);

{
  const a = resolveUniformMushafFontSize(360, 600);
  const b = resolveUniformMushafFontSize(360, 600);
  assert.equal(a, b);
  assert.equal(
    mushafUniformFitCacheKey(360, 600, "qpc-v2-p126"),
    mushafUniformFitCacheKey(360, 600, "qpc-v2-p127"),
  );
  assert.equal(
    resolveUniformMushafFontSize(360, 600),
    resolveUniformMushafFontSize(390, 700) > 0
      ? resolveUniformMushafFontSize(360, 600)
      : -1,
  );
  assert.notEqual(
    mushafUniformFitCacheKey(360, 600, "qpc"),
    mushafUniformFitCacheKey(390, 600, "qpc"),
  );
}

const SAMPLE = [1, 2, 3, 4, 126, 127, 128, 249, 436, 604] as const;
const pagesDir = resolve(root, "public/data/quran-v2/pages");

for (const n of SAMPLE) {
  const file = resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `ناقصة: صفحة ${n}`);
}

const publicRoot = resolve(root, "public");
const origFetch = globalThis.fetch;
try {
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
    const file = resolve(publicRoot, path.replace(/^\//, ""));
    if (!existsSync(file)) return new Response("missing", { status: 404 });
    return new Response(readFileSync(file), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  resetMushafPageCachesForTests();
  clearDedupePool();

  const layouts = [];
  for (const n of SAMPLE) {
    layouts.push(await loadMushafPage(n));
  }

  for (const layout of layouts) {
    assert.equal(layout.layoutMode, "standard");
    const lineSlots = layout.rows
      .filter((r) => r.kind === "line")
      .map((r) => r.gridSlot);
    assert.ok(
      lineSlots.every((s) => s >= 1 && s <= 15),
      `خانات خارج ١٥ في ص${layout.pageNumber}`,
    );
  }

  const p126 = layouts.find((l) => l.pageNumber === 126)!;
  const p127 = layouts.find((l) => l.pageNumber === 127)!;
  const p128 = layouts.find((l) => l.pageNumber === 128)!;

  assert.equal(p126.surahsStartingOnPage.length, 0, "١٢٦ استمرار لا بداية سورة");
  assert.equal(p127.surahsStartingOnPage.length, 0, "١٢٧ استمرار لا بداية سورة");
  assert.equal(p128.surahsStartingOnPage.length, 1, "١٢٨ بداية الأنعام");
  assert.equal(p128.surahsStartingOnPage[0]?.id, 6);

  const header128 = p128.rows.find((r) => r.kind === "surah-header");
  assert.ok(header128 && header128.kind === "surah-header");
  assert.equal(header128.bannerSlot, 1);
  assert.ok(header128.basmalaSlot === 2 || header128.basmalaSlot == null);

  const slots126 = p126.rows.filter((r) => r.kind === "line").map((r) => r.gridSlot);
  const slots127 = p127.rows.filter((r) => r.kind === "line").map((r) => r.gridSlot);
  assert.deepEqual(slots126, slots127, "١٢٦ و١٢٧ نفس شبكة الأسطر (١٥ خانة نص)");
  assert.equal(slots126.length, 15);

  const lineSlots128 = p128.rows.filter((r) => r.kind === "line").map((r) => r.gridSlot);
  assert.ok(lineSlots128[0]! >= 3, "نص الأنعام يبدأ بعد الشارة/البسملة");
  assert.ok(Math.max(...lineSlots128) <= 15);
} finally {
  globalThis.fetch = origFetch;
  resetMushafPageCachesForTests();
  clearDedupePool();
}

console.log(
  "mushaf-page-layout-consistency-gate.test.ts: ok pages=",
  SAMPLE.join(","),
);
