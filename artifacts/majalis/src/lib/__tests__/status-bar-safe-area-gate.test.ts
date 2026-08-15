/**
 * بوابة: شريط الحالة + safe-area بدون فراغ مزدوج أو شريط تشخيص دائم.
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
assert.match(cap, /overlaysWebView:\s*false/);
assert.match(cap, /backgroundColor:\s*"#F2F4F3"/);
assert.doesNotMatch(cap, /StatusBar:[\s\S]*backgroundColor:\s*"#002b21"/);

const utils = read("src/lib/capacitor-utils.ts");
assert.match(utils, /setOverlaysWebView\(\{\s*overlay:\s*false\s*\}\)/);
assert.match(utils, /STATUS_BAR_BG_LIGHT\s*=\s*"#F2F4F3"/);
assert.match(utils, /STATUS_BAR_BG_DARK\s*=\s*"#101614"/);
assert.match(utils, /Style\.Light/);
assert.match(utils, /Style\.Dark/);

const nativeCss = read("src/styles/capacitor-native-ux.css");
assert.match(nativeCss, /html\.capacitor-native\s*\{[^}]*--inset-top:\s*0px/s);
assert.match(nativeCss, /--header-h:\s*var\(--header-chrome/);

const main = read("src/main.tsx");
assert.match(main, /setProperty\("--inset-top",\s*"0px"\)/);

const debug = read("src/components/SafeAreaDebugOverlay.tsx");
assert.doesNotMatch(debug, /localStorage\.setItem\(KEY/);
assert.match(debug, /removeItem\("majalis-safe-area-debug"\)/);

const hero = read("src/styles/components/home-brand-title.css");
assert.doesNotMatch(hero, /inset-top/);

const navbar = read("src/styles/final-release.css");
assert.match(navbar, /\.navbar-v3\s*\{[^}]*padding-block-start:\s*var\(--inset-top\)/s);
assert.match(navbar, /\.navbar-menu-btn[^}]*min-height:\s*44px/s);

console.log("status-bar-safe-area-gate.test.ts: ok");
