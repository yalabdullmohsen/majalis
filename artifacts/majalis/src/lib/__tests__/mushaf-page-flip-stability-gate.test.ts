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
assert.match(reader, /isQpcPageFontReady/);
assert.match(reader, /displayView/);
assert.match(reader, /layout\.pageNumber === page/);
assert.match(reader, /getCachedMushafPage\(page\)/);
assert.match(reader, /shell\.scrollTop = 0/);
assert.match(reader, /ارتفاع الحاوية ثابت/);
assert.match(reader, /dockRemainsAfterClear/);
assert.match(reader, /ayahWasOpen/);
assert.match(reader, /dockWasVisible/);
/* التقليب لا يفتح رصيف التلاوة من لقطة الصوت */
{
  const snapIdx = reader.indexOf("audio.onSnapshot");
  const snapEnd = reader.indexOf("audio.onAyahChange", snapIdx);
  assert.ok(snapIdx >= 0 && snapEnd > snapIdx, "onSnapshot block present");
  assert.doesNotMatch(
    reader.slice(snapIdx, snapEnd),
    /setAudioDockOpen\(\s*true\s*\)/,
    "snapshot must not force-open tilawah dock",
  );
}
assert.match(reader, /onLongPressVerse/);
assert.match(reader, /openTafsir/);
/* عزل التفسير عن التقليب — نية صريحة فقط */
assert.match(reader, /createTafsirOpenIntent/);
assert.match(reader, /isValidTafsirOpenIntent/);
assert.match(reader, /bumpTafsirGeneration/);
assert.match(reader, /onPanVisualStart/);
assert.match(reader, /tafsirOpenRef\.current/);
assert.doesNotMatch(
  reader.slice(reader.indexOf("onLongPressVerse"), reader.indexOf("openTafsir")),
  /setTafsirOpen\(\s*true\s*\)/,
  "Long-press must not open tafsir without explicit intent",
);

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
assert.match(metrics, /data-mushaf-font-locked|WIDTH_LOCK|lockedWidth/);
assert.match(metrics, /lockedBodyHRef/);
assert.match(metrics, /عرض الشاشة|عرض الحاوية|lockedWidth/);

assert.match(css, /\.nm-slot\s*\{[^}]*align-items:\s*flex-start/s);
assert.match(css, /height:\s*var\(--mushaf-body-height/);
assert.match(css, /contain:\s*layout style/);
assert.match(css, /data-mushaf-metrics/);
assert.match(css, /transition:\s*none/);
assert.doesNotMatch(css, /transform:\s*scale\(/, "Mushaf font-size changed after page flip: transform:scale forbidden");
assert.doesNotMatch(
  css,
  /is-panning[^}]*opacity:\s*0\.9/,
  "Pager sheet opacity flicker during pan forbidden",
);
assert.match(page, /منع layout shift عند قلب الصفحة/, "MushafPage must guard layout shift on flip");
assert.match(page, /mushaf-page-number/);
assert.match(page, /mushaf-footer-height, 40px/);

assert.match(pager, /translate3d/);
assert.match(pager, /onNavigateCancel/);
assert.match(pager, /لا resetToCurrent قبل go/);
assert.doesNotMatch(pager, /marginTop|paddingTop|scrollTop\s*=/);
assert.doesNotMatch(pager, /scale\(/, "Mushaf pager must not use transform:scale");
/* كان: reset ثم go → وميض الصفحة القديمة؛ الآن go ثم reset عبر [page] */
assert.doesNotMatch(
  pager,
  /pendingCommit\.current = null;\s*resetToCurrent\(false\);\s*go\(commit\)/,
  "Must not snap track back before committing page",
);

assert.match(dock, /اختر القارئ/);
assert.match(dock, /getReciter/);
assert.match(dock, /onPlayRange/);
assert.match(dock, /وضع الحفظ/);
/* عقد عنوان Preset الكلاسيكي — لا صيغة «تفسير ${surahName} · آية» القديمة */
assert.match(tafsir, /سورة \$\{surahName\}، الآية \$\{parsed\.ayah\}/);
assert.match(tafsir, /setSnap/);
assert.match(sheetCss, /68dvh/);
assert.match(sheetCss, /mushaf-bottom-safe-space/);

assert.match(reader, /audioDockMini|onMiniChange/);
assert.match(reader, /playRange/);

console.log("mushaf-page-flip-stability-gate.test.ts: ok");
