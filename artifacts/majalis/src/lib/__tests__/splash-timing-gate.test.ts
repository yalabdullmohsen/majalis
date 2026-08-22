/**
 * بوابة: بلا دخولية حاجبة — طبقة لون تُزال فورًا + هيكل ويب.
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

assert.match(splash, /SPLASH_MIN_VISIBLE_MS\s*=\s*0/);
assert.match(splash, /SPLASH_MAX_VISIBLE_MS\s*=\s*400/);
assert.match(splash, /app:first-paint/);
assert.match(splash, /mj\.native-splash\.session/);
assert.match(cap, /launchAutoHide:\s*false/);
assert.match(main, /armNativeSplashController/);
assert.match(main, /app:first-paint/);
assert.doesNotMatch(main, /AppSplash/);
assert.equal(existsSync(resolve(root, "src/components/AppSplash.tsx")), false);
assert.match(html, /MIN_MS\s*=\s*0/);
assert.match(html, /dismiss\(true\)/, "إزالة فورية بلا انتظار");
assert.doesNotMatch(html, /id="mj-boot-skeleton"/, "بلا هيكل تحميل كامل");
assert.doesNotMatch(html, /mj-silent-splash__title/);
assert.doesNotMatch(html, /mj-silent-splash__progress/);

console.log("splash-timing-gate.test.ts: ok");
