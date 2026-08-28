/**
 * بوابة: توقيت Startup Gate — حد أدنى 500ms وسقف 1500ms.
 * تشغيل: node --import tsx src/lib/__tests__/splash-timing-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const splash = readFileSync(resolve(root, "src/lib/splash-screen.ts"), "utf8");
const cap = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");
const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const majlisSplash = readFileSync(resolve(root, "src/lib/majlis-splash.ts"), "utf8");

assert.match(majlisSplash, /SPLASH_MIN_VISIBLE_MS\s*=\s*500/);
assert.match(majlisSplash, /SPLASH_MAX_VISIBLE_MS\s*=\s*1_?500|SPLASH_MAX_VISIBLE_MS\s*=\s*1500/);
assert.match(majlisSplash, /SPLASH_FADE_OUT_MS\s*=\s*120/);
assert.match(splash, /SPLASH_MIN_VISIBLE_MS/);
assert.match(splash, /SPLASH_MAX_VISIBLE_MS/);
assert.match(splash, /app:first-paint/);
assert.match(cap, /launchAutoHide:\s*false/);
assert.match(main, /armNativeSplashController/);
assert.match(main, /app:first-paint/);
assert.ok(existsSync(resolve(root, "src/components/MajlisSplash.tsx")));
assert.match(html, /id="mj-(launch-splash|startup-gate)"/);
assert.match(html, /MIN_MS\s*=\s*500/);
assert.match(html, /MAX_MS\s*=\s*1500/);
assert.match(html, /EXIT_MS\s*=\s*120/);
assert.doesNotMatch(html, /mj-launch-splash__tagline/);
assert.match(html, /splash_timing=1/, "معامل قياس توقيت البوابة");
assert.doesNotMatch(html, /id="mj-silent-splash"/);
assert.doesNotMatch(html, /id="mj-boot-skeleton"/, "بلا هيكل تحميل كامل");

console.log("splash-timing-gate.test.ts: ok");
