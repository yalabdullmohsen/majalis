/**
 * بوابة دقة عرض الطباعة: تنعيم، liga/calt لغير-PUA، حدود مقياس، عزل اتجاهي، قياس canvas.
 * تشغيل: node --import tsx src/lib/__tests__/typography-render-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clampQuranFontSize,
  clampReadingTextSize,
  clampUiFontScale,
  QURAN_FONT_MAX_PX,
  QURAN_FONT_MIN_PX,
  UI_FONT_SCALE_MAX,
  UI_FONT_SCALE_MIN,
} from "../quran-font-size";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p: string) => readFileSync(resolve(appRoot, p), "utf8");

const mushaf = read("features/mushaf-madinah/mushaf-madinah.css");
assert.match(mushaf, /-webkit-text-size-adjust:\s*100%/);
assert.match(mushaf, /font-feature-settings:\s*normal/);
assert.match(mushaf, /font-variant-ligatures:\s*none/);
assert.doesNotMatch(mushaf, /\.mm-ayah-line\s*\{[^}]*font-feature-settings:\s*"liga"/);

const fontsQuran = read("styles/fonts-quran.css");
assert.match(fontsQuran, /font-display:\s*block/);
assert.match(fontsQuran, /format\("woff2"\)/);
assert.match(fontsQuran, /font-feature-settings:\s*"liga" 1,\s*"calt" 1/);
assert.match(fontsQuran, /AmiriQuran-Regular\.woff2/);

const typo = read("styles/typography-app.css");
assert.match(typo, /font-feature-settings:\s*"liga" 1,\s*"calt" 1/);
assert.match(typo, /\.mj-bidi-isolate/);
assert.match(typo, /--ui-font-scale-max:\s*1\.35/);

const settings = read("pages/account/ui/SettingsView.tsx");
assert.match(settings, /draftQuranScale/);
assert.match(settings, /onPointerUp/);
assert.match(settings, /commitQuranScale/);
assert.match(settings, /mj-bidi-isolate/);

const fit = read("features/mushaf-madinah/fitPageFontSize.ts");
assert.match(fit, /releaseCanvasResources/);

const qpcHook = read("features/mushaf-madinah/useQpcPageFont.ts");
assert.match(qpcHook, /FontFace/);
assert.match(qpcHook, /display:\s*"block"/);
assert.match(qpcHook, /getPowerSaverState/);

assert.ok(existsSync(resolve(appRoot, "../public/fonts/amiri-quran/AmiriQuran-Regular.woff2")));
assert.ok(existsSync(resolve(appRoot, "../public/fonts/qpc-v2")));

assert.equal(clampQuranFontSize(100), QURAN_FONT_MAX_PX);
assert.equal(clampQuranFontSize(1), QURAN_FONT_MIN_PX);
assert.equal(clampReadingTextSize(99), 32);
assert.equal(clampUiFontScale(2), UI_FONT_SCALE_MAX);
assert.equal(clampUiFontScale(0.1), UI_FONT_SCALE_MIN);

console.log("typography-render-gate: OK");
