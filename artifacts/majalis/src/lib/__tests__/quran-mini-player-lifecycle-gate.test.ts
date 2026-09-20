/**
 * بوابة عقد مشغّل التلاوة العالمي: Close ≠ Collapse ≠ Stop.
 * تشغيل: node --import tsx src/lib/__tests__/quran-mini-player-lifecycle-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const bar = read("src/components/quran/QuranMiniPlayerBar.tsx");
const store = read("src/lib/quran-mini-player.ts");
const css = read("src/styles/components/quran-mini-player.css");
const chrome = read("src/styles/components/quran-audio-chrome.css");
const dock = read("src/features/mushaf-madinah/MushafAudioDock.tsx");
const settingsShell = read("src/features/mushaf-madinah/quran-sheet/QuranSheetShell.tsx");
const ayah = read("src/features/mushaf-madinah/AyahActionSheet.tsx");

/* CLOSE صريح في المصغّر والموسَّع */
assert.match(bar, /aria-label="إغلاق مشغل التلاوة"/);
assert.match(bar, /data-testid="quran-mini-player-close"/);
assert.match(bar, /طي المشغل/);
assert.match(bar, /توسيع المشغل/);
assert.match(bar, /stopMiniPlayer\(\)/);
assert.match(bar, /setExpanded\(false\)/);
assert.match(bar, /<details className="quran-mini-player__hifz"/);

/* السحب لأسفل يطوي فقط */
{
  const idx = bar.indexOf("onPointerUp");
  const block = bar.slice(idx, idx + 500);
  assert.match(block, /setExpanded\(false\)/);
  assert.doesNotMatch(block, /stopMiniPlayer/, "swipe must not close");
}

/* CLOSE يفرّغ المحرّك ويخفي */
assert.match(store, /stopAndUnload\(\)/);
assert.match(store, /hideMiniPlayer\(\)/);
assert.match(store, /setLoopConfig/);

/* طبقات z + إزاحة عوائم */
assert.match(chrome, /--z-audio-mini:\s*210/);
assert.match(chrome, /--z-audio-expanded:\s*230/);
assert.match(css, /z-index:\s*var\(--z-audio-mini/);
assert.match(css, /z-index:\s*var\(--z-audio-expanded/);
assert.match(css, /html:has\(\.quran-mini-player\)/);
assert.match(css, /quran-mini-player--expanded[\s\S]*?scroll-to-top/);
assert.match(css, /max-height:\s*min\(46dvh/);
assert.doesNotMatch(css, /linear-gradient\(\s*165deg/);

/* رصيف المصحف نفس تسمية الإغلاق */
assert.match(dock, /aria-label="إغلاق مشغل التلاوة"/);

/* إعدادات + آية: إغلاق رأس مضغوط + شيتات مضغوطة */
assert.match(settingsShell, /quran-sheet__close/);
assert.match(settingsShell, /mushaf-settings-close/);
assert.match(settingsShell, /quran-audio-chrome\.css/);
assert.match(ayah, /ayah-actions-close/);
assert.match(ayah, /mm-ayah-bar__close/);
assert.match(chrome, /mm-settings-sheet \.quran-sheet__close/);
assert.match(chrome, /ayah-action-sheet\.is-collapsed/);
assert.doesNotMatch(chrome, /nm-page__fatiha-medallion/);
assert.match(chrome, /max-height:\s*min\(42dvh/);
assert.match(dock, /quran-audio-chrome\.css/);

console.log("quran-mini-player-lifecycle-gate.test.ts: ok");
