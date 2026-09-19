/**
 * بوابة فصل إغلاق/طي/إيقاف رصيف التلاوة — الطي لا يوقف التشغيل.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-audio-dock-dismiss-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const dock = read("src/features/mushaf-madinah/MushafAudioDock.tsx");
const player = read("src/components/quran/QuranAudioPlayer.tsx");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const verified = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
const css = read("src/styles/components/quran-audio-dock-dismiss.css");
const madinahCss = read("src/features/mushaf-madinah/mushaf-madinah.css");
const readerCss = read("src/features/mushaf-reader/mushaf-reader.css");

/* ضوابط صريحة: إغلاق · طي · إيقاف */
assert.match(dock, /mushaf-dock-close/);
assert.match(dock, /mushaf-dock-collapse/);
assert.match(dock, /mushaf-dock-stop/);
assert.match(dock, /mushaf-dock-handle/);
assert.match(dock, /onStop\?:/);
assert.match(dock, /dir="rtl"/);
assert.match(dock, /COLLAPSE_SWIPE_PX|onMiniChange\(true\)/);
assert.match(dock, /onPointerDown=\{onSwipePointerDown\}/);
assert.match(dock, /aria-label=\{mini \? "توسيع المشغل" : "طي المشغل"\}/);
assert.match(dock, /aria-label="إيقاف التلاوة"/);
assert.match(dock, /aria-label="إغلاق مشغل التلاوة"/);
assert.match(dock, /quran-audio-dock-dismiss\.css/);

/* الطي عبر السحب لا يستدعي pause/stop */
{
  const swipeIdx = dock.indexOf("onSwipePointerUp");
  assert.ok(swipeIdx >= 0, "swipe handler present");
  const swipeBlock = dock.slice(swipeIdx, swipeIdx + 600);
  assert.doesNotMatch(swipeBlock, /\.pause\(|\.stop\(/, "swipe collapse must not stop playback");
  assert.match(swipeBlock, /onMiniChange\(true\)/);
  assert.match(swipeBlock, /onMiniChange\(false\)/);
}

/* غلاف المشغّل يمرّر onStop */
assert.match(player, /onStop=\{onStop\}/);

/* القارئ: إغلاق يوقف · طي عبر onMiniChange فقط · إيقاف منفصل */
{
  const playerIdx = reader.indexOf("<QuranAudioPlayer");
  assert.ok(playerIdx >= 0, "QuranAudioPlayer usage");
  const playerBlock = reader.slice(playerIdx, playerIdx + 2200);
  assert.match(playerBlock, /onClose=\{\(\) => \{/);
  assert.match(playerBlock, /setAudioDockOpen\(false\)/);
  assert.match(playerBlock, /recitation\.stop\(\)/);
  assert.doesNotMatch(playerBlock, /recitation\.pause\(\)/, "close must not merely pause");
  assert.match(playerBlock, /onStop=\{\(\) => \{[\s\S]*?recitation\.stop\(\)/);
  assert.match(playerBlock, /onMiniChange=\{setAudioDockMini\}/);
}
assert.doesNotMatch(
  reader,
  /onMiniChange=\{\([^)]*\)\s*=>\s*\{[^}]*\.(pause|stop)\(/s,
  "mini toggle must not pause/stop",
);

{
  const dockIdx = verified.indexOf("<MushafAudioDock");
  assert.ok(dockIdx >= 0, "Verified MushafAudioDock usage");
  const dockBlock = verified.slice(dockIdx, dockIdx + 2200);
  assert.match(dockBlock, /onClose=\{\(\) => \{/);
  assert.match(dockBlock, /setAudioDockOpen\(false\)/);
  assert.match(dockBlock, /audio\.stop\(\)/);
  assert.doesNotMatch(dockBlock, /audio\.pause\(\)/, "verified close must not merely pause");
  assert.match(dockBlock, /onStop=\{\(\) => \{[\s\S]*?audio\.stop\(\)/);
}

/* مساحات آمنة + مقبض بدون قفزات تخطيط */
assert.match(css, /mm-audio-dock__handle/);
assert.match(css, /mm-audio-dock__stop/);
assert.match(madinahCss, /--inset-bottom/);
assert.match(readerCss, /--safe-bottom/);

console.log("mushaf-audio-dock-dismiss-gate.test.ts: ok");
