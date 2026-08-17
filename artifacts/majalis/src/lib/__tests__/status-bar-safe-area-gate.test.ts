/**
 * بوابة: شريط الحالة + safe-area مع overlay وPageChrome (بدون فراغ مزدوج أو شريط أبيض ثابت).
 * node --import tsx src/lib/__tests__/status-bar-safe-area-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const html = read("index.html");
assert.match(html, /viewport-fit=cover/);
assert.match(html, /width=device-width, initial-scale=1, viewport-fit=cover/);

const cap = read("capacitor.config.ts");
assert.match(cap, /overlaysWebView:\s*true/);
assert.match(cap, /StatusBar:\s*\{[^}]*backgroundColor:\s*"#F2F4F3"/s);
assert.doesNotMatch(cap, /StatusBar:\s*\{[^}]*backgroundColor:\s*"#0E1A15"/s);
assert.match(cap, /ios:\s*\{[\s\S]*?backgroundColor:\s*"#0E1A15"/);

const utils = read("src/lib/capacitor-utils.ts");
assert.match(utils, /STATUS_BAR_BG_LIGHT\s*=\s*"#F2F4F3"/);
assert.match(utils, /STATUS_BAR_BG_DARK\s*=\s*"#101614"/);
assert.match(utils, /apply-page-chrome|reapplyPageChromeFromLocation/);

const apply = read("src/lib/apply-page-chrome.ts");
assert.match(apply, /setOverlaysWebView\(\{\s*overlay:\s*true\s*\}\)/);
assert.match(apply, /Style\.Dark/);
assert.match(apply, /Style\.Light/);
assert.match(apply, /--app-status-bg/);

const chrome = read("src/lib/page-chrome.ts");
assert.match(chrome, /PRAYER_STATUS_HEX\s*=\s*"#091814"/);
assert.match(chrome, /statusBarStyle:\s*"light"/);
assert.match(chrome, /resolvePageChromeKey/);

const nativeCss = read("src/styles/capacitor-native-ux.css");
assert.doesNotMatch(nativeCss, /html\.capacitor-native\s*\{[^}]*--inset-top:\s*0px/s);
assert.match(nativeCss, /--app-status-bg/);
assert.match(nativeCss, /--header-h:\s*calc\(var\(--header-chrome/);

const main = read("src/main.tsx");
assert.doesNotMatch(main, /setProperty\("--inset-top",\s*"0px"\)/);
assert.match(main, /--app-status-bg/);

const app = read("src/App.tsx");
assert.match(app, /PageChromeSync/);

const debug = read("src/components/SafeAreaDebugOverlay.tsx");
assert.doesNotMatch(debug, /localStorage\.setItem\(KEY/);
assert.match(debug, /removeItem\("majalis-safe-area-debug"\)/);

const hero = read("src/styles/components/home-brand-title.css");
assert.doesNotMatch(hero, /inset-top/);

const navbar = read("src/styles/final-release.css");
assert.match(navbar, /\.navbar-v3\s*\{[^}]*padding-block-start:\s*var\(--inset-top\)/s);
assert.match(navbar, /\.navbar-menu-btn[^}]*min-height:\s*44px/s);
assert.match(navbar, /--app-status-bg/);

console.log("status-bar-safe-area-gate.test.ts: ok");
