/**
 * بوابة وضع القراءة الغامر — Reader Chrome + Exit Overlay.
 * node --import tsx src/lib/__tests__/mushaf-immersive-reader-chrome-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MUSHAF_CHROME_HIDE_MS } from "@/features/mushaf-madinah/layout-bands";
import {
  resolveSunnahMushafSignaturePreset,
  SUNNAH_MUSHAF_SIGNATURE_PRESET_ID,
  resolveSignatureFontSizePx,
} from "@/features/mushaf-reader/sunnah-mushaf-signature-preset";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");
const repoRoot = resolve(root, "../..");

console.log("=== Immersive default ===");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
assert.match(reader, /readerChromeVisible/);
assert.match(reader, /useState\(false\)/);
assert.match(reader, /onTapEmpty/);
assert.equal(MUSHAF_CHROME_HIDE_MS, 4000);
/** خروج واحد داخل Toolbar — بلا طبقة خروج عائمة متداخلة */
assert.doesNotMatch(reader, /MushafExitControl/);
assert.match(reader, /MushafControlsLayer/);
assert.match(reader, /busy=\{edgesDisabled/);

console.log("=== Compact toolbar exit (لا تراكب) ===");
const controls = read("src/features/mushaf-reader/MushafControlsLayer.tsx");
assert.match(controls, /nm-controls__exit/);
assert.match(controls, /الخروج من المصحف/);
assert.match(controls, /nm-controls--compact/);
assert.doesNotMatch(read("src/features/mushaf-reader/MushafPage.tsx"), /MushafExitControl/);

const css = read("src/features/mushaf-reader/mushaf-reader.css");
assert.match(css, /\.nm-controls--compact/);
assert.match(css, /var\(--inset-top/);
assert.match(css, /data-focus-reading/);
assert.match(css, /opacity:\s*0/);
const chromeCss = read("src/styles/reader-page-chrome.css");
assert.match(chromeCss, /\.nm-exit-control/);
assert.match(chromeCss, /data-busy/);
assert.match(reader, /reader-page-chrome\.css/);

console.log("=== Signature active ===");
const sig = resolveSunnahMushafSignaturePreset();
assert.equal(sig.presetId, SUNNAH_MUSHAF_SIGNATURE_PRESET_ID);
assert.equal(sig.fontId, "qpc-v2");
assert.equal(sig.linesPerPage, 15);
assert.equal(sig.lineHeight, 1.85);
assert.ok(sig.contentInsets.sidePx <= 8);
const layout = read("src/features/mushaf-reader/useStableMushafLayout.ts");
assert.match(layout, /resolveSignatureFontSizePx/);
assert.match(layout, /signature-bands/);
assert.match(layout, /LINE_HEIGHT = "1\.85"/);
assert.match(layout, /HEADER_H = 36/);
assert.match(layout, /FOOTER_H = 40/);
assert.doesNotMatch(layout, /resolveUniformMushafFontSize/);
assert.ok(resolveSignatureFontSizePx(360, 700) >= 21);

console.log("=== Surah frame + tafsir + highlight ===");
assert.match(read("src/features/mushaf-reader/MushafSurahBanner.tsx"), /MushafSurahFrame/);
assert.match(css, /mushaf-surah-frame-bg/);
assert.match(css, /nm-surah-banner__ornament/);
assert.match(css, /clip-path:\s*polygon/);
assert.doesNotMatch(css, /\.nm-surah-banner__ornament\s*\{[^}]*linear-gradient\(\s*45deg/);
assert.doesNotMatch(css, /\.nm-surah-banner__ornament\s*\{[^}]*linear-gradient\(\s*-45deg/);
assert.match(css, /\.nm-surah-banner\s*\{[^}]*border-radius:\s*0(?:px|rem)?/);
const tafsir = read("src/features/mushaf-madinah/MushafTafsirSheet.tsx");
assert.match(tafsir, /mushaf-tafsir-ref/);
const metaStart = tafsir.indexOf("mm-tafsir__meta");
const metaEnd = tafsir.indexOf("mm-tafsir__toolbar");
assert.ok(metaStart >= 0 && metaEnd > metaStart);
assert.doesNotMatch(tafsir.slice(metaStart, metaEnd), /سورة \$\{surahName\}، الآية/);
assert.match(css, /border-radius:\s*0\.35em/);

console.log("=== Mini player compact ===");
const dock = read("src/features/mushaf-madinah/MushafAudioDock.tsx");
assert.match(dock, /data-mini/);
assert.match(dock, /SkipBack/);
assert.match(dock, /SkipForward/);
assert.match(dock, /mm-audio-dock__advanced/);

console.log("=== setup-workspace smoke ===");
const activate = readFileSync(resolve(repoRoot, ".github/actions/setup-workspace/activate-pnpm.sh"), "utf8");
assert.match(activate, /hash -r/);
assert.match(activate, /npm install -g/);
const action = readFileSync(resolve(repoRoot, ".github/actions/setup-workspace/action.yml"), "utf8");
assert.match(action, /Setup workspace smoke/);

console.log("mushaf-immersive-reader-chrome-gate.test.ts: ok");
