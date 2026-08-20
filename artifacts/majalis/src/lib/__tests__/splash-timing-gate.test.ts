/**
 * بوابة: سياسة توقيت الدخولية الأصلية + الهيكل على الويب.
 * تشغيل: node --import tsx src/lib/__tests__/splash-timing-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const splash = readFileSync(resolve(root, "src/lib/splash-screen.ts"), "utf8");
const cap = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");
const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const appSplash = readFileSync(resolve(root, "src/components/AppSplash.tsx"), "utf8");

assert.match(splash, /SPLASH_MIN_VISIBLE_MS\s*=\s*900/);
assert.match(splash, /SPLASH_MAX_VISIBLE_MS\s*=\s*1500/);
assert.match(splash, /SPLASH_FADE_OUT_MS\s*=\s*250/);
assert.match(splash, /app:first-paint/);
assert.match(splash, /mj\.native-splash\.session/);
assert.match(cap, /launchAutoHide:\s*false/);
assert.match(main, /armNativeSplashController/);
assert.match(main, /app:first-paint/);
assert.match(html, /MIN_MS\s*=\s*900/);
assert.match(html, /MAX_MS\s*=\s*1500/);
assert.match(html, /EXIT_MS\s*=\s*250/);
assert.match(html, /if \(!native\) \{\s*dismiss\(true\);/, "الويب بلا دخولية حاجبة");
assert.match(html, /id="mj-boot-skeleton"/, "هيكل فوري على الويب");
assert.match(html, /mj-silent-splash__title/, "عنوان على دخولية الأصل");
assert.match(html, /mj-silent-splash__subtitle/, "سطر على دخولية الأصل");
assert.match(html, /mj-silent-splash__progress/, "مؤشر على دخولية الأصل");
assert.match(appSplash, /MIN_MS = 900/);
assert.match(appSplash, /MAX_MS = 1500/);
assert.match(appSplash, /EXIT_MS = 250/);

console.log("splash-timing-gate.test.ts: ok");
