/**
 * لفّ صفحة المصحف — ثوابت ووجود الخطاف.
 * تشغيل: npx tsx src/lib/__tests__/mushaf-page-curl.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const hook = readFileSync(resolve(appRoot, "src/hooks/useMushafPageCurl.ts"), "utf8");
const view = readFileSync(resolve(appRoot, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
const css = readFileSync(resolve(appRoot, "src/styles/pages/mushaf-reader.css"), "utf8");

assert.match(hook, /COMMIT_FRAC\s*=\s*0\.25/);
assert.match(hook, /VELOCITY_PX_MS\s*=\s*0\.5/);
assert.match(hook, /prefers-reduced-motion/);
assert.match(hook, /onNext/);
assert.match(view, /useMushafPageCurl/);
assert.match(view, /mpv-curl-stage/);
assert.match(view, /curlDisabled/);
assert.match(view, /textChromeVisible/);
assert.match(css, /\.mpv-curl-leaf/);
assert.match(css, /rotateY/);
assert.match(css, /prefers-reduced-motion/);

console.log("mushaf-page-curl.test.ts: ok");
