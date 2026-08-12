/**
 * بوابة: شريط تشخيص خطوط المصحف لا يظهر في إنتاج الويب.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const src = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../components/quran/QpcFontPackBanner.tsx"),
  "utf8",
);

assert.match(src, /import\.meta\.env\.DEV/);
assert.match(src, /fontDebug/);
assert.match(src, /if \(showUi\) setVisible\(true\)/);
assert.match(src, /if \(!visible \|\| !showUi\) return null/);

console.log("qpc-font-banner-prod-gate.test.ts: ok");
