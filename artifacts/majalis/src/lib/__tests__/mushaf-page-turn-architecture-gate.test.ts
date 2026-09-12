/**
 * بوابة إعادة هندسة ثبات تقليب المصحف (P0).
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-turn-architecture-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/pages/quran/MushafReaderPage.tsx");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const pager = read("src/features/mushaf-reader/useMushafPager.ts");
const gate = read("src/features/mushaf-madinah/useMushafResourceGate.ts");
const cache = read("src/features/mushaf-reader/mushaf-page-render-cache.ts");
const tele = read("src/features/mushaf-reader/mushaf-turn-telemetry.ts");
const font = read("src/features/mushaf-madinah/useQpcPageFont.ts");
const metrics = read("src/features/mushaf-reader/useStableMushafLayout.ts");

/* 1) لا Navigation لكل صفحة — حالة داخلية + replaceState هادئ */
assert.match(page, /setPageNumber/);
assert.match(page, /history\.replaceState/);
assert.match(page, /urlSyncTimer|syncUrlQuietly/);
assert.doesNotMatch(
  page,
  /onPageChange=\{\(n\)\s*=>\s*navigateTo\(`\/mushaf\?page=/,
  "page turn must not navigateTo on every flip",
);
assert.match(page, /bootPageRef/);
assert.match(page, /readerMounted/);

/* 2) Prefetch لا يُفكك عند وميض الجاهزية */
assert.match(gate, /stickyPrefetchRef/);
assert.match(gate, /لا يُطفأ|لا يُلغى/);
assert.doesNotMatch(
  gate,
  /if\s*\(!canMountPage\)\s*\{\s*setAllowOffscreenPrefetch\(false\)/,
  "must not clear adjacent prefetch when canMountPage flickers",
);

/* 3) Geometry لا تُعاد قياسها عند كل صفحة */
assert.match(pager, /widthRef\.current > 0/);
assert.match(pager, /لا تعد قياس العرض عند كل صفحة|لا تعد قياس/);
assert.match(pager, /translate3d/);
assert.doesNotMatch(pager, /scale\(/);

/* 4) Font preload قبل الرسم */
assert.match(font, /ensureQpcPageFont/);
assert.match(font, /loaded\.has/);
assert.match(reader, /ensureQpcPageFont\(page \+ 1\)/);
assert.match(reader, /ensureQpcPageFont\(page - 1\)/);
assert.match(reader, /isQpcPageFontReady/);

/* 5) Render cache + telemetry (debug) */
assert.match(cache, /putPageRenderModel/);
assert.match(cache, /setMushafGeometryKey/);
assert.match(cache, /MAX_ENTRIES|geometryKey/);
assert.match(reader, /putPageRenderModel/);
assert.match(reader, /setMushafGeometryKey/);
assert.match(tele, /enableMushafTurnTelemetry/);
assert.match(tele, /import\.meta\.env/);
assert.match(reader, /mushafTurnMark\("touchStart"/);

/* 6) قفل المقاييس أثناء التقليب */
assert.match(metrics, /data-pager-settled/);
assert.match(metrics, /lockedSizeRef|data-mushaf-font-locked/);
assert.match(metrics, /WIDTH_LOCK/);
assert.doesNotMatch(reader, /key=\{pageNumber\}/);
assert.doesNotMatch(reader, /key=\{page\}/);

console.log("mushaf-page-turn-architecture-gate.test.ts: ok");
