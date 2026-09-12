/**
 * بوابة تفاعل P0 — رموز موحّدة + single-flight + قفل تنقّل + Pressable.
 * node --import tsx src/lib/__tests__/premium-interaction-p0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GESTURE_THRESHOLDS,
  MOTION_DURATION_MS,
  resetNavLockForTests,
  resetSingleFlightForTests,
  runSingleFlight,
  runSingleFlightSync,
  shouldAllowScreenNavigation,
} from "@/lib/interaction";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

assert.ok(existsSync(resolve(root, "src/lib/interaction/tokens.ts")));
assert.ok(existsSync(resolve(root, "src/lib/interaction/single-flight.ts")));
assert.ok(existsSync(resolve(root, "src/lib/interaction/nav-lock.ts")));
assert.ok(existsSync(resolve(root, "docs/PREMIUM_INTERACTION_P0_BASELINE.md")));

assert.equal(MOTION_DURATION_MS.instant, 80);
assert.equal(MOTION_DURATION_MS.fast, 140);
assert.ok(GESTURE_THRESHOLDS.tapSlopPx >= 8);

resetSingleFlightForTests();
let runs = 0;
assert.equal(
  runSingleFlightSync("t1", () => {
    runs += 1;
  }),
  true,
);
assert.equal(
  runSingleFlightSync("t1", () => {
    runs += 1;
  }),
  false,
);
assert.equal(runs, 1);

resetSingleFlightForTests();
let asyncRuns = 0;
const p1 = runSingleFlight("async1", async () => {
  asyncRuns += 1;
  return 1;
});
const p2 = runSingleFlight("async1", async () => {
  asyncRuns += 1;
  return 2;
});
const [r1, r2] = await Promise.all([p1, p2]);
assert.equal(r1, 1);
assert.equal(r2, undefined);
assert.equal(asyncRuns, 1);

resetNavLockForTests();
assert.equal(shouldAllowScreenNavigation("/a"), true);
assert.equal(shouldAllowScreenNavigation("/a"), false);
assert.equal(shouldAllowScreenNavigation("/b"), true);

const nav = read("src/lib/navigation-intent.ts");
assert.match(nav, /allowScreenNav|NAV_COOLDOWN_MS/);
assert.doesNotMatch(nav, /await\s+fetch/);
assert.doesNotMatch(nav, /setTimeout\s*\(\s*\(\)\s*=>\s*boundNavigate/);

const btn = read("src/components/design-system/ActionButton.tsx");
assert.match(btn, /is-loading|loading/);
assert.match(btn, /mj-pressable/);

const pressable = read("src/components/motion/Pressable.tsx");
assert.match(pressable, /data-pressed/);
assert.match(pressable, /onPointerDown/);

const fav = read("src/components/FavoriteButton.tsx");
assert.match(fav, /busy/);
assert.match(fav, /mj-pressable/);

const instant = read("src/styles/components/instant-interaction.css");
assert.match(instant, /data-pressed/);
assert.match(instant, /is-loading/);
assert.match(instant, /prefers-reduced-motion/);

const main = read("src/main.tsx");
assert.match(main, /import\(["']\.\/lib\/resource-prewarm["']\)/);
assert.match(main, /import\(["']\.\/lib\/init-final-polish["']\)/);

const pkg = read("package.json");
assert.equal(/framer-motion/.test(pkg), false);

console.log("premium-interaction-p0-gate.test.ts: ok");
