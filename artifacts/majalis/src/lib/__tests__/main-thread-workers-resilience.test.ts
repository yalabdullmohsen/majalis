/**
 * Part 3 — main-thread workers / scroll / locks / feature-detect suite.
 * Run: pnpm --filter @workspace/majalis run test:main-thread-workers
 */
import assert from "node:assert/strict";
import {
  aggregateDayMetrics,
  filterDocsByNeedle,
  prepareNeedleVariants,
  coreArabicIncludes,
} from "../arabic-match-core.ts";
import { computeListWindow, sliceWindowed } from "../list-window.ts";
import {
  detectBrowserFeatures,
  resetBrowserFeaturesCache,
  safeVibrate,
} from "../browser-features.ts";
import { withStorageLockSync } from "../storage-lock.ts";
import { arabicIncludes, arabicMatchAny } from "../arabic-search.ts";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn();
      passed += 1;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ ${name}`);
      console.error(err);
    }
  })();
}

function ensureLs() {
  if (typeof globalThis.localStorage !== "undefined") return;
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  } as Storage;
}

ensureLs();

console.log("\n=== Arabic match core ===");
await test("prepare + includes", () => {
  const v = prepareNeedleVariants(["صلاة"]);
  assert.ok(v.length > 0);
  assert.equal(coreArabicIncludes("أحكام الصلاة اليومية", v), true);
  assert.equal(coreArabicIncludes("الزكاة", v), false);
});

await test("filterDocsByNeedle", () => {
  const ids = filterDocsByNeedle(
    [
      { id: "1", fields: ["صلاة الفجر"] },
      { id: "2", fields: ["زكاة المال"] },
      { id: "3", fields: ["أحكام الصلاة"] },
    ],
    prepareNeedleVariants(["صلاة"]),
  );
  assert.deepEqual(ids.sort(), ["1", "3"]);
});

await test("arabic-search facade still works", () => {
  assert.equal(arabicIncludes("سورة البقرة", "بقرة"), true);
  assert.equal(arabicMatchAny(["عنوان", "نص"], "عنوان"), true);
});

console.log("\n=== Analytics aggregate ===");
await test("aggregateDayMetrics", () => {
  const r = aggregateDayMetrics([
    { tasksCompleted: 2, tasksTotal: 4, pagesRead: 3, active: true },
    { tasksCompleted: 4, tasksTotal: 4, pagesRead: 1, active: true },
  ]);
  assert.equal(r.totalPages, 4);
  assert.equal(r.activeDays, 2);
  assert.equal(r.completionRate, 0.75);
});

console.log("\n=== List window ===");
await test("computeListWindow overscan", () => {
  const win = computeListWindow({
    total: 100,
    scrollTop: 500,
    viewportHeight: 600,
    itemHeight: 50,
    overscan: 2,
  });
  // firstVisible = 10, visible ~13, start=8, end=min(100, 10+13+2)=25
  assert.equal(win.start, 8);
  assert.ok(win.end > win.start);
  const slice = sliceWindowed(Array.from({ length: 100 }, (_, i) => i), win);
  assert.equal(slice.length, win.length);
  assert.equal(slice[0], win.start);
});

console.log("\n=== Feature detect ===");
await test("detectBrowserFeatures shape", () => {
  resetBrowserFeaturesCache();
  const f = detectBrowserFeatures();
  assert.equal(typeof f.vibrate, "boolean");
  assert.equal(typeof f.webWorker, "boolean");
  assert.equal(typeof f.broadcastChannel, "boolean");
  assert.equal(typeof f.speechRecognition, "boolean");
  assert.equal(typeof f.webCryptoSubtle, "boolean");
  assert.equal(safeVibrate(10), false); // no vibrate in node
});

console.log("\n=== Storage lock ===");
await test("withStorageLockSync runs critical section", () => {
  let ran = false;
  withStorageLockSync("test-lock", () => {
    ran = true;
    return 1;
  });
  assert.equal(ran, true);
});

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
