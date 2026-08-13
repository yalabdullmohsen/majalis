/**
 * لفّ ورقة مصحف — بوابة.
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
const basmala = readFileSync(resolve(appRoot, "src/components/quran/BasmalaLine.tsx"), "utf8");

assert.match(hook, /COMMIT_FRAC\s*=\s*0\.25/);
assert.match(hook, /VELOCITY_PX_MS\s*=\s*0\.5/);
assert.match(hook, /SETTLE_MS\s*=\s*320/);
assert.match(hook, /SNAP_BACK_MS\s*=\s*160/);
assert.match(hook, /FLIP_EDGE_FRAC\s*=\s*0\.15/);
assert.match(hook, /onCenterTap/);
assert.match(hook, /classifyTap/);
assert.match(hook, /requestAnimationFrame/);
assert.match(hook, /progressRef/);
assert.match(hook, /prefers-reduced-motion/);
assert.match(hook, /onNext/);
assert.match(hook, /onPrev/);
/* يمين = التالية · يسار = السابقة */
assert.match(hook, /rel >= w - edge\) return "next"/);
assert.match(hook, /rel <= edge\) return "prev"/);

assert.match(view, /useMushafPageFlip/);
assert.match(view, /MushafPageFlipStage/);
assert.match(view, /flipDisabled/);
assert.match(view, /neighborLayouts/);
assert.match(view, /getMushafSpread/);
assert.match(view, /prefetchMushafPage/);
assert.doesNotMatch(view, /useMushafPageCurl|mpv-curl-stage/);

assert.match(stage, /mpv-flip-stage/);
assert.match(stage, /mpv-flip-underlay/);
assert.match(stage, /mpv-flip-leaf/);
assert.match(stage, /mpv-flip-leaf__curl/);
assert.match(stage, /mpv-flip-shade/);
assert.match(stage, /data-mushaf-active-leaf/);
assert.match(stage, /data-page-state/);
assert.match(stage, /data-page-state="active"/);
assert.match(stage, /visibility/);
assert.match(stage, /mpv-flip-underlay__paper/);

assert.match(css, /\.mpv-flip-leaf/);
assert.match(css, /rotateY\(calc\(var\(--mpv-flip, 0\) \* -12deg\)\)/);
assert.match(css, /perspective:\s*1600px/);
assert.match(css, /320ms cubic-bezier\(0\.22,\s*0\.61,\s*0\.36,\s*1\)/);
assert.match(css, /contain:\s*layout/);
assert.doesNotMatch(css, /\.mpv-flip-leaf\s*\{[^}]*contain:\s*layout paint/);
assert.match(css, /mpv-flip-stage--flipping/);
assert.match(css, /prefers-reduced-motion/);
assert.doesNotMatch(css, /\.mpv-curl-leaf/);
assert.match(stage, /mpv-flip-stage--flipping/);

assert.match(basmala, /BASMALA_QPC_WORDS/);
assert.match(basmala, /mushafPageFontFamily\(1\)/);
assert.match(basmala, /showNumber/);

assert.deepEqual(getMushafSpread(1, true), { left: null, right: 1, focus: 1, isSpread: false });
assert.deepEqual(getMushafSpread(5, true), { left: 4, right: 5, focus: 5, isSpread: true });
assert.deepEqual(getMushafSpread(4, true), { left: 4, right: 5, focus: 4, isSpread: true });
assert.equal(prefersMushafSpread(1024, 700), true);
assert.equal(prefersMushafSpread(390, 844), false);

console.log("mushaf-page-flip.test.ts: ok");
