/**
 * بوابة: عدّ الصلاة المنزلي على نبضة ثانية موحّدة (لا setInterval مكرّر).
 * تشغيل: node --import tsx src/lib/__tests__/home-compact-prayer-tick-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const compact = readFileSync(
  resolve(root, "src/components/home/HomeCompactPrayer.tsx"),
  "utf8",
);
const scheduler = readFileSync(resolve(root, "src/lib/adhan-scheduler.ts"), "utf8");
const mem = readFileSync(resolve(root, "src/lib/memory-pressure.ts"), "utf8");

assert.match(compact, /subscribeSecondTick/);
assert.doesNotMatch(compact, /setInterval\s*\(/);

assert.match(scheduler, /setTimeout\s*\(/);
assert.doesNotMatch(scheduler, /setInterval\s*\(/);

assert.match(mem, /visibilityState === "hidden"/);
assert.match(mem, /stopPoll|clearInterval/);

console.log("\nhome-compact-prayer-tick-gate.test.ts: ok");
