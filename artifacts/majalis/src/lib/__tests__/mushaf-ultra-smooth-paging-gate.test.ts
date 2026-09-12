/**
 * بوابة Ultra Smooth Mushaf Paging — transform فقط، بلا rebuild أثناء السحب، prefetch ±2.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-ultra-smooth-paging-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pager = read("src/features/mushaf-reader/useMushafPager.ts");
const shell = read("src/features/mushaf-reader/MushafPager.tsx");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const tele = read("src/features/mushaf-reader/mushaf-turn-telemetry.ts");
const bands = read("src/features/mushaf-madinah/layout-bands.ts");

/* 1) settle ورقي هادئ */
assert.match(pager, /SETTLE_MS\s*=\s*220/);
assert.match(bands, /MUSHAF_SETTLE_MS\s*=\s*220/);
assert.match(pager, /MUSHAF_PAPER_EASE/);
assert.match(pager, /cubic-bezier\(0\.25,\s*0\.1,\s*0\.25,\s*1\)/);
assert.doesNotMatch(pager, /\bbounce\b|\bspring\b|\belastic\b/i);

/* 2) transform فقط + rAF coalesce */
assert.match(pager, /translate3d/);
assert.match(pager, /scheduleTrackX/);
assert.match(pager, /requestAnimationFrame/);
assert.match(pager, /snapPx/);
assert.doesNotMatch(pager, /scale\(/);
assert.doesNotMatch(css, /is-panning[^}]*opacity:\s*0\.[0-9]/);

/* 3) لا onNavigateStart عند أول بكسل */
assert.match(pager, /onPanVisualStart/);
assert.match(pager, /onGestureArm/);
assert.match(shell, /onPanVisualStart/);
assert.match(shell, /onGestureArm/);
assert.match(reader, /onPanVisualStart/);
assert.match(reader, /onGestureArm/);
const moveStart = pager.indexOf("const onPointerMove");
const moveEnd = pager.indexOf("const finishGesture", moveStart);
assert.ok(moveStart >= 0 && moveEnd > moveStart, "pointer move / finishGesture blocks");
const moveBlock = pager.slice(moveStart, moveEnd);
assert.doesNotMatch(moveBlock, /onNavigateStart/);
assert.match(moveBlock, /onPanVisualStart/);

/* 4) prefetch ±2 */
assert.match(reader, /page \+ 2/);
assert.match(reader, /page - 2/);

/* 5) طبقة composited + تجميد أثناء السحب */
assert.match(css, /data-ultra-smooth/);
assert.match(css, /data-mushaf-panning/);
assert.match(reader, /data-ultra-smooth/);
assert.match(pager, /data-mushaf-panning/);
assert.match(css, /translateZ\(0\)|will-change:\s*transform|backface-visibility:\s*hidden/);

/* 6) قفل geometry */
assert.match(pager, /لا تعد قياس العرض عند كل صفحة/);
assert.match(pager, /widthRef\.current > 0/);
assert.match(pager, /لا resetToCurrent قبل go/);

/* 7) telemetry إطارات */
assert.match(tele, /frameTimeMsP95/);
assert.match(tele, /frameTimeMsP99/);
assert.match(tele, /frameTimeMsWorst/);
assert.match(tele, /touchToMoveMs/);
assert.match(tele, /requestAnimationFrame/);
assert.match(reader, /mushafTurnMark\("touchStart"/);
assert.match(reader, /mushafTurnMark\("firstPageMovement"/);

console.log("mushaf-ultra-smooth-paging-gate.test.ts: ok");
