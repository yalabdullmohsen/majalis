/**
 * بوابة: سياسة توقيت الدخولية الأصلية (ثابتة + منطق).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const splash = readFileSync(resolve(root, "src/lib/splash-screen.ts"), "utf8");
const cap = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");
const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");

assert.match(splash, /SPLASH_MIN_VISIBLE_MS\s*=\s*900/);
assert.match(splash, /SPLASH_MAX_VISIBLE_MS\s*=\s*1500/);
assert.match(splash, /SPLASH_FADE_OUT_MS\s*=\s*250/);
assert.match(splash, /app:first-paint/);
assert.match(splash, /mj\.native-splash\.session/);
assert.match(cap, /launchAutoHide:\s*false/);
assert.match(main, /armNativeSplashController/);
assert.match(main, /app:first-paint/);

console.log("splash-timing-gate.test.ts: ok");
