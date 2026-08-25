/**
 * بوابة: Ultimate Master Protocol — zero-crash، أداء، UX، handoff.
 * تشغيل: node --import tsx src/lib/__tests__/sovereign-ultimate-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stepSpring, isSpringSettled } from "../sovereign/fluid-gesture-engine";
import { guardSync, guardAsync } from "../sovereign/isolation-guard";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = resolve(appRoot, "../../..");
const read = (p: string) => readFileSync(resolve(appRoot, p), "utf8");

const bootstrap = read("lib/sovereign/sovereign-bootstrap.ts");
assert.match(bootstrap, /installZeroCrashGuards/);
assert.match(bootstrap, /startPerformanceSentinel/);
assert.match(bootstrap, /startAmbientUxEngine/);
assert.match(bootstrap, /startDeviceHandoffSync/);

const isolation = read("lib/sovereign/isolation-guard.ts");
assert.match(isolation, /guardAsync/);
assert.match(isolation, /unhandledrejection/);

const perf = read("lib/sovereign/performance-sentinel.ts");
assert.match(perf, /getFrameHealthSnapshot/);
assert.match(perf, /purgeUnderMemoryPressure/);

const fluid = read("lib/sovereign/fluid-gesture-engine.ts");
assert.match(fluid, /stepSpring/);
assert.match(fluid, /bindFluidSwipe/);

const ambient = read("lib/sovereign/ambient-ux-engine.ts");
assert.match(ambient, /dataset\.ambientPhase/);
assert.match(ambient, /computeAmbientUx/);

const handoff = read("lib/sovereign/device-handoff-sync.ts");
assert.match(handoff, /MAX_BYTES = 1024/);
assert.match(handoff, /publishDeviceHandoff/);

const theme = read("app/styles/theme.css");
assert.match(theme, /--mj-ambient-contrast/);

assert.ok(existsSync(resolve(repoRoot, "scripts/store-compliance-audit.mjs")));

// Spring physics sanity
let spring = { value: 0, velocity: 0, target: 100 };
for (let i = 0; i < 120; i++) spring = stepSpring(spring, 1 / 60);
assert.ok(isSpringSettled(spring) || spring.value > 90);

// Guard sanity
assert.equal(guardSync(() => 42, 0), 42);
assert.equal(guardSync(() => { throw new Error("x"); }, 7), 7);
const asyncVal = await guardAsync(async () => "ok", "fallback");
assert.equal(asyncVal, "ok");

console.log("sovereign-ultimate-gate: OK");
