/**
 * بوابة المرحلة 6: خطوط عثماني / VirtualList / ميكروفون / ثيمات القارئ.
 * تشغيل: node --import tsx src/lib/__tests__/phase6-typography-virtual-mic.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  QURAN_FONT_MAX_PX,
  QURAN_FONT_MIN_PX,
  clampQuranFontSize,
} from "../quran-font-size";
import {
  detectMicHelpPlatform,
  micHelpSteps,
  queryMicPermission,
} from "../mic-permission";
import { DEFAULT_PREFERENCES } from "../user-preferences";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../../");
const src = resolve(root, "src");

function read(rel: string) {
  return readFileSync(resolve(src, rel), "utf8");
}

// ── Font range 14–32 ────────────────────────────────────────────────────────
assert.equal(QURAN_FONT_MIN_PX, 14);
assert.equal(QURAN_FONT_MAX_PX, 32);
assert.equal(clampQuranFontSize(12), 14);
assert.equal(clampQuranFontSize(40), 32);
assert.equal(clampQuranFontSize(20), 20);

// ── Local Amiri + KFGQPC alias + preload ─────────────────────────────────────
const indexCss = read("index.css");
assert.match(indexCss, /"Amiri Quran"/);
assert.match(indexCss, /"KFGQPC Hafs Uthmanic"/);
assert.match(indexCss, /size-adjust/);
assert.match(indexCss, /ascent-override/);

const html = readFileSync(resolve(root, "index.html"), "utf8");
assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
assert.match(html, /fonts\/ui\/amiri-400-ar\.woff2/);
assert.ok(existsSync(resolve(root, "public/fonts/amiri-quran/AmiriQuran-Regular.woff2")));
assert.ok(existsSync(resolve(root, "public/fonts/qpc-v2/p1.woff2")));
assert.ok(existsSync(resolve(root, "public/fonts/ui/amiri-400-ar.woff2")));

const main = read("main.tsx");
assert.doesNotMatch(main, /warmStaticQuranicFonts/, "لا تسخين خطوط مصحف على كل صفحة");
assert.match(read("pages/quran/MushafReaderPage.tsx"), /warmStaticQuranicFonts/);
assert.match(read("styles/fonts-ui.css"), /\/fonts\/ui\/amiri-400-ar\.woff2/);

assert.ok(existsSync(resolve(root, "public/fonts/qpc-v2/p1.woff2")), "خطوط QPC محفوظة كبيانات");

// ── VirtualList wiring ──────────────────────────────────────────────────────
assert.ok(existsSync(resolve(src, "components/VirtualList.tsx")));
const vlist = read("components/VirtualList.tsx");
assert.match(vlist, /virtualizeAbove/);
assert.match(vlist, /scrollToIndex/);

assert.match(read("pages/quran/ui/SurahIndexView.tsx"), /VirtualList/);
assert.match(read("pages/account/ui/SearchView.tsx"), /VirtualList/);
assert.match(read("pages/quran/ui/QuranSearchView.tsx"), /VirtualList/);
assert.match(read("pages/hadith/ui/HadithBooksView.tsx"), /VirtualList/);
assert.match(read("components/quran/QuranSurahJumpSearch.tsx"), /VirtualList/);

// ── Mic permission UX ───────────────────────────────────────────────────────
assert.ok(existsSync(resolve(src, "lib/mic-permission.ts")));
assert.ok(existsSync(resolve(src, "components/MicPermissionHelp.tsx")));
assert.equal(detectMicHelpPlatform({ isNative: true, isIOS: true }), "ios");
assert.equal(detectMicHelpPlatform({ isNative: true, isAndroid: true }), "android");
assert.match(micHelpSteps("chrome"), /الميكروفون/);
assert.match(micHelpSteps("safari"), /سفاري/);
assert.match(read("hooks/useRecitationTest.ts"), /ensureMicPermission/);
assert.match(read("components/quran/RecitationTestPanel.tsx"), /MicPermissionHelp/);
assert.match(read("pages/quran/ui/RecitationTestView.tsx"), /MicPermissionHelp/);

const state = await queryMicPermission();
assert.ok(["granted", "denied", "prompt", "unsupported"].includes(state));

// ── Reader themes ───────────────────────────────────────────────────────────
assert.equal(DEFAULT_PREFERENCES.readingTheme, "default");
assert.match(read("lib/user-preferences.ts"), /ReadingThemeId/);
assert.match(read("components/reading/ContentActionBar.tsx"), /cycleTheme|readingTheme/);
assert.match(indexCss, /data-reading-theme="sepia"/);
assert.match(indexCss, /data-reading-theme="night"/);

// ── SW caches fonts ─────────────────────────────────────────────────────────
const sw = readFileSync(resolve(root, "public/sw.js"), "utf8");
assert.match(sw, /\/fonts\//);

console.log("phase6-typography-virtual-mic.test.ts: ok");
