/**
 * بوابة ثبات قلب الصفحة — لا خلط خط/بيانات، لا توسيط عمودي يقفز، جاهزية قبل العرض.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-flip-stability-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const page = read("src/features/mushaf-reader/MushafPage.tsx");
const qpc = read("src/features/mushaf-madinah/useQpcPageFont.ts");
const pager = read("src/features/mushaf-reader/useMushafPager.ts");
const metrics = read("src/features/mushaf-reader/useStableMushafLayout.ts");
const miniBar = read("src/components/quran/QuranMiniPlayerBar.tsx");
const dock = read("src/features/mushaf-madinah/MushafAudioDock.tsx");
const tafsir = read("src/features/mushaf-madinah/MushafTafsirSheet.tsx");
const sheetCss = read("src/features/mushaf-madinah/quran-sheet/quran-sheet.css");

assert.match(metrics, /useStableMushafLayout/);
assert.match(metrics, /data-mushaf-layout-source/);
assert.match(read("src/features/mushaf-reader/useMushafFixedMetrics.ts"), /useStableMushafLayout/);

assert.match(qpc, /export function ensureQpcPageFont/);
assert.match(qpc, /loaded\.has\(pageNumber\)/);
assert.match(qpc, /useLayoutEffect/);
assert.doesNotMatch(qpc, /setReady\(loaded\.has/);

assert.match(reader, /ensureQpcPageFont\(clamped\)/);
assert.match(reader, /layout\.pageNumber === page/);
assert.match(reader, /getCachedMushafPage\(page\)/);
assert.match(reader, /shell\.scrollTop = 0/);
assert.match(reader, /ارتفاع الحاوية ثابت/);
assert.match(reader, /dockRemainsAfterClear/);
assert.match(reader, /ayahWasOpen/);
assert.match(reader, /onLongPressVerse/);
assert.match(reader, /openTafsir/);
assert.match(pager, /onAyah/);
assert.match(pager, /panSlopFor/);
assert.match(read("src/features/mushaf-reader/MushafVerseLayer.tsx"), /LONG_PRESS_MS/);
assert.match(reader, /useStableMushafLayout\(metricsRootRef,\s*true\)/);
assert.match(reader, /stableView/);
assert.match(reader, /onNavigateCancel/);
assert.doesNotMatch(
  reader,
  /setTimeout\(\s*\(\)\s*=>\s*\{\s*finishPageTurn/,
  "No setTimeout used to patch mushaf layout after flip",
);
assert.match(miniBar, /if \(immersive\) return null/);

assert.match(metrics, /1\.05/);
assert.match(metrics, /--mushaf-letter-spacing/);
assert.match(metrics, /data-mushaf-font-locked|WIDTH_LOCK|lockedWidthRef/);
assert.match(metrics, /عرض الشاشة|عرض الحاوية|lockedWidth/);

assert.match(css, /\.nm-slot\s*\{[^}]*align-items:\s*flex-start/s);
assert.match(css, /height:\s*var\(--mushaf-body-height/);
assert.match(css, /contain:\s*layout style/);
assert.match(css, /data-mushaf-metrics/);
assert.match(css, /transition:\s*none/);
assert.doesNotMatch(css, /transform:\s*scale\(/, "Mushaf font-size changed after page flip: transform:scale forbidden");
assert.match(page, /منع layout shift عند قلب الصفحة/, "MushafPage must guard layout shift on flip");

assert.match(pager, /translate3d/);
assert.match(pager, /onNavigateCancel/);
assert.doesNotMatch(pager, /marginTop|paddingTop|scrollTop\s*=/);
assert.doesNotMatch(pager, /scale\(/, "Mushaf pager must not use transform:scale");

assert.match(dock, /اختر القارئ/);
assert.match(dock, /getReciter/);
assert.match(dock, /onPlayRange/);
assert.match(dock, /وضع الحفظ/);
assert.match(tafsir, /تفسير \$\{surahName\} · آية/);
assert.match(tafsir, /setSnap/);
assert.match(sheetCss, /68dvh/);
assert.match(sheetCss, /mushaf-bottom-safe-space/);

assert.match(reader, /audioDockMini|onMiniChange/);
assert.match(reader, /playRange/);

console.log("mushaf-page-flip-stability-gate.test.ts: ok");
