/**
 * بوابة التنقّل المكاني: تصنيف push/pop/tab/modal + تخطّي بعد السحب.
 * node --import tsx src/lib/__tests__/spatial-nav.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyNavMotion,
  isModalNavPath,
  isTabRootPath,
  routeDepth,
  skipNextRouteMotion,
} from "../spatial-nav";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

assert.equal(isTabRootPath("/"), true);
assert.equal(isTabRootPath("/quran-hub"), true);
assert.equal(isTabRootPath("/quran-hub/surah/1"), false);
assert.equal(routeDepth("/fiqh/prayer"), 2);
assert.equal(isModalNavPath("/search"), true);

assert.equal(classifyNavMotion("/quran-hub", "/quran-hub/surah/2", false), "push");
assert.equal(classifyNavMotion("/quran-hub/surah/2", "/quran-hub", true), "pop");
assert.equal(classifyNavMotion("/quran-hub", "/lessons", false), "tab");
assert.equal(classifyNavMotion("/fiqh", "/search", false), "modal");

skipNextRouteMotion();
assert.equal(classifyNavMotion("/a", "/b", true), "none");

const native = read("src/styles/components/native-feel.css");
assert.match(native, /mj-route-push-in/);
assert.match(native, /mj-route-pop-in/);
assert.match(native, /mj-edge-swipe-scrim/);
assert.match(native, /mj-back-nudge/);

const edge = read("src/components/motion/EdgeSwipeBack.tsx");
assert.match(edge, /skipNextRouteMotion/);
assert.match(edge, /translate3d/);
assert.match(edge, /COMMIT_RATIO/);

const route = read("src/components/motion/RouteEnterMotion.tsx");
assert.match(route, /classifyNavMotion/);
assert.match(route, /mj-route-push/);

const pkg = read("package.json");
assert.equal(/framer-motion/.test(pkg), false, "لا framer-motion");

console.log("spatial-nav.test.ts: ok");
