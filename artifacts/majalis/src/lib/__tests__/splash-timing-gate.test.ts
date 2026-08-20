/**
 * بوابة: سياسة توقيت الدخولية الأصلية + الهيكل على الويب.
 * تشغيل: node --import tsx src/lib/__tests__/splash-timing-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const bootState = readFileSync(resolve(root, "src/boot/boot-state.ts"), "utf8");
const bootIos = readFileSync(resolve(root, "src/boot/platform/ios.ts"), "utf8");
const cap = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");
const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");

assert.match(bootState, /BOOT_MIN_VISIBLE_MS\s*=\s*900/);
assert.match(bootState, /BOOT_MAX_VISIBLE_MS\s*=\s*1500/);
assert.match(bootState, /BOOT_FADE_OUT_MS\s*=\s*250/);
assert.match(bootState, /mj\.boot\.session/);
assert.match(bootIos, /app:first-paint/);
assert.match(cap, /launchAutoHide:\s*false/);
assert.match(main, /mountBoot\(\)/);
assert.match(main, /app:first-paint/);
assert.match(html, /MIN_MS\s*=\s*900/);
assert.match(html, /MAX_MS\s*=\s*1500/);
assert.match(html, /EXIT_MS\s*=\s*250/);
assert.match(html, /id="mj-boot-layer"/, "هيكل فوري على الويب");
assert.match(html, /mj-boot-native__title/, "عنوان على دخولية الأصل");
assert.match(html, /mj-boot-native__subtitle/, "سطر على دخولية الأصل");
assert.match(html, /mj-boot-native__progress/, "مؤشر على دخولية الأصل");

console.log("splash-timing-gate.test.ts: ok");
