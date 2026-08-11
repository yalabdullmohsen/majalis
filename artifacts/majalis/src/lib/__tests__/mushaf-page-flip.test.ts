/**
 * تقليب مصحف حقيقي — بوابة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-flip.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getMushafSpread, prefersMushafSpread } from "../mushaf-spread";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

assert.ok(!existsSync(resolve(appRoot, "src/hooks/useMushafPageCurl.ts")), "أُزيل الخطاف القديم");

const hook = readFileSync(resolve(appRoot, "src/hooks/useMushafPageFlip.ts"), "utf8");
const view = readFileSync(resolve(appRoot, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
const stage = readFileSync(resolve(appRoot, "src/components/quran/MushafPageFlipStage.tsx"), "utf8");
const css = readFileSync(resolve(appRoot, "src/styles/pages/mushaf-reader.css"), "utf8");

assert.match(hook, /COMMIT_FRAC\s*=\s*0\.16/);
assert.match(hook, /VELOCITY_PX_MS\s*=\s*0\.32/);
assert.match(hook, /SETTLE_MS\s*=\s*320/);
assert.match(hook, /FLIP_EDGE_FRAC/);
assert.match(hook, /onCenterTap/);
assert.match(hook, /classifyTap/);
assert.match(hook, /prefers-reduced-motion/);
assert.match(hook, /onNext/);
assert.match(hook, /onPrev/);

assert.match(view, /useMushafPageFlip/);
assert.match(view, /MushafPageFlipStage/);
assert.match(view, /flipDisabled/);
assert.match(view, /neighborLayouts/);
assert.match(view, /getMushafSpread/);
assert.doesNotMatch(view, /useMushafPageCurl|mpv-curl-stage/);

assert.match(stage, /mpv-flip-stage/);
assert.match(stage, /mpv-flip-underlay/);
assert.match(stage, /mpv-flip-leaf/);

assert.match(css, /\.mpv-flip-leaf/);
assert.match(css, /rotateY\(calc\(var\(--mpv-flip, 0\) \* -78deg\)\)/);
assert.match(css, /perspective:\s*1600px/);
assert.match(css, /mpv-flip-stage--flipping/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /320ms/);
assert.doesNotMatch(css, /\.mpv-curl-leaf/);
assert.match(stage, /mpv-flip-stage--flipping/);

assert.deepEqual(getMushafSpread(1, true), { left: null, right: 1, focus: 1, isSpread: false });
assert.deepEqual(getMushafSpread(5, true), { left: 4, right: 5, focus: 5, isSpread: true });
assert.deepEqual(getMushafSpread(4, true), { left: 4, right: 5, focus: 4, isSpread: true });
assert.equal(prefersMushafSpread(1024, 700), true);
assert.equal(prefersMushafSpread(390, 844), false);

console.log("mushaf-page-flip.test.ts: ok");
