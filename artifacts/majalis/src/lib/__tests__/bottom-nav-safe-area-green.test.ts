/**
 * بوابة: لا شريط أبيض تحت الشريط السفلي — bleed أخضر + safe-area معتم.
 * node --import tsx src/lib/__tests__/bottom-nav-safe-area-green.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const html = read("index.html");
assert.match(html, /viewport-fit=cover/);

const finalCss = read("src/styles/final-release.css");
assert.match(finalCss, /--mj-splash,\s*#002b21/);
assert.match(finalCss, /padding-bottom:\s*var\(--inset-bottom\)/);
assert.match(finalCss, /backdrop-filter:\s*none/);
assert.match(finalCss, /linear-gradient\([\s\S]*--inset-bottom/);
assert.match(finalCss, /#root,\s*\n\.app-shell/);

const foundation = read("src/styles/m2030/foundation.css");
assert.match(foundation, /background-color:\s*var\(--mj-splash,\s*#002b21\)/);

const native = read("src/styles/capacitor-native-ux.css");
assert.match(native, /html\.capacitor-native[\s\S]*--mj-splash,\s*#002b21/);

const capTs = read("capacitor.config.ts");
assert.match(capTs, /ios:\s*\{[\s\S]*backgroundColor:\s*"#002b21"/);
assert.doesNotMatch(capTs, /ios:\s*\{[\s\S]*backgroundColor:\s*"#ffffff"/);
assert.doesNotMatch(capTs, /ios:\s*\{[\s\S]*backgroundColor:\s*"#F2F4F3"/);

const androidCap = read("android/app/src/main/assets/capacitor.config.json");
assert.doesNotMatch(androidCap, /"#ffffff"/);
assert.match(androidCap, /"backgroundColor":\s*"#002b21"/);

console.log("bottom-nav-safe-area-green.test.ts: ok");
