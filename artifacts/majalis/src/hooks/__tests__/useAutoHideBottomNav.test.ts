/**
 * اختبارات منطق useAutoHideBottomNav / عتبة الإخفاء.
 * التشغيل: node --import tsx src/hooks/__tests__/useAutoHideBottomNav.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveShouldHideChrome } from "../useScrollDirection.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const hook = readFileSync(resolve(root, "hooks/useAutoHideBottomNav.ts"), "utf8");
const bar = readFileSync(resolve(root, "components/BottomNavBar.tsx"), "utf8");
const css = readFileSync(resolve(root, "styles/components/app-chrome-scroll.css"), "utf8");
const app = readFileSync(resolve(root, "App.tsx"), "utf8");

assert.match(hook, /export function useAutoHideBottomNav/);
assert.match(hook, /isHidden/);
assert.match(hook, /showNav/);
assert.match(hook, /hideNav/);
assert.match(hook, /DELTA_PX\s*=\s*10/);
assert.match(hook, /capture:\s*true/);
assert.match(hook, /mm-ayah-bar/);

assert.match(bar, /bottom-nav--hidden/);
assert.match(bar, /bottom-nav--visible/);
assert.match(bar, /isHidden/);

assert.match(css, /bottom-nav--hidden/);
assert.match(css, /220ms ease/);
assert.match(css, /translateY\(var\(--bottom-nav-hide-shift\)\)/);
assert.match(css, /pointer-events:\s*none/);
assert.match(css, /prefers-reduced-motion/);
assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ""), /display\s*:\s*none/);

assert.match(app, /useAutoHideBottomNav/);
assert.match(app, /isHidden=\{shouldHideChrome\}/);

assert.deepEqual(
  resolveShouldHideChrome({ scrollY: 80, deltaY: 12, currentlyHidden: false, forceShow: false }),
  { isScrollingDown: true, shouldHideChrome: true },
  "نزول فوق العتبة يخفي",
);

assert.deepEqual(
  resolveShouldHideChrome({ scrollY: 80, deltaY: -12, currentlyHidden: true, forceShow: false }),
  { isScrollingDown: false, shouldHideChrome: false },
  "صعود يظهر",
);

assert.deepEqual(
  resolveShouldHideChrome({ scrollY: 10, deltaY: 40, currentlyHidden: true, forceShow: false }),
  { isScrollingDown: false, shouldHideChrome: false },
  "أعلى الصفحة يظهر دائمًا",
);

console.log("useAutoHideBottomNav.test.ts: ok");
