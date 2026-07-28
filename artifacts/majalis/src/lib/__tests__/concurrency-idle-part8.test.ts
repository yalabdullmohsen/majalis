/**
 * Part 8 — concurrency, idle scheduling, progressive JSON, hibernation, hydration.
 * Run: npx tsx src/lib/__tests__/concurrency-idle-part8.test.ts
 */

import {
  withStorageLock,
  withSyncMutex,
  createGenerationGuard,
  _clearLocalLockChains,
} from "../storage-lock";
import { runWhenIdle, yieldToMain, mapInIdleSlices } from "../idle-defer";
import { mapInChunks, forEachInChunks } from "../json-progressive-loader";
import {
  ensureHibernationBinding,
  getHibernationState,
  isTabHibernating,
} from "../background-hibernation";
import { useClientReady } from "../client-hydration";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

const listenerMap = new Map<string, Set<EventListenerOrEventListenerObject>>();
(globalThis as unknown as { window: Window }).window = {
  addEventListener: (type: string, handler: EventListenerOrEventListenerObject) => {
    if (!listenerMap.has(type)) listenerMap.set(type, new Set());
    listenerMap.get(type)!.add(handler);
  },
  removeEventListener: (type: string, handler: EventListenerOrEventListenerObject) => {
    listenerMap.get(type)?.delete(handler);
  },
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  setInterval: globalThis.setInterval.bind(globalThis),
  requestIdleCallback: (cb: (d: { didTimeout: boolean; timeRemaining: () => number }) => void) => {
    const id = globalThis.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 10 }), 5);
    return id as unknown as number;
  },
  cancelIdleCallback: (id: number) => globalThis.clearTimeout(id),
} as unknown as Window;

(globalThis as unknown as { document: Document }).document = {
  visibilityState: "visible",
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
} as unknown as Document;

console.log("\n=== 1. Storage mutex / generation guard ===");
{
  _clearLocalLockChains();
  const order: number[] = [];
  await Promise.all([
    withStorageLock("k", async () => {
      order.push(1);
      await new Promise((r) => setTimeout(r, 20));
      order.push(2);
    }),
    withStorageLock("k", async () => {
      order.push(3);
    }),
  ]);
  assert(order.join(",") === "1,2,3", "locks serialize async work");

  let n = 0;
  withSyncMutex("s", () => {
    n++;
  });
  withSyncMutex("s", () => {
    n++;
  });
  assert(n === 2, "sync mutex allows sequential calls");

  const g = createGenerationGuard();
  const a = g.next();
  const b = g.next();
  assert(g.isCurrent(b) && !g.isCurrent(a), "generation guard invalidates stale tokens");
}

console.log("\n=== 2. Idle scheduling ===");
{
  let ran = false;
  await new Promise<void>((resolve) => {
    runWhenIdle(
      () => {
        ran = true;
        resolve();
      },
      { timeoutMs: 100, requireVisible: true },
    );
  });
  assert(ran, "runWhenIdle executes");
  await yieldToMain();
  assert(true, "yieldToMain resolves");

  const mapped = await mapInIdleSlices([1, 2, 3, 4], (x) => x * 2, { sliceSize: 2, timeoutMs: 200 });
  assert(mapped.join(",") === "2,4,6,8", "mapInIdleSlices works");
}

console.log("\n=== 3. Chunked array processing ===");
{
  const items = Array.from({ length: 100 }, (_, i) => i);
  const out: number[] = [];
  await forEachInChunks(items, (x) => out.push(x), { chunkSize: 25 });
  assert(out.length === 100, "forEachInChunks visits all");
  const doubled = await mapInChunks(items, (x) => x * 2, { chunkSize: 40 });
  assert(doubled[50] === 100, "mapInChunks maps correctly");
}

console.log("\n=== 4. Hibernation binding ===");
{
  ensureHibernationBinding();
  const snap = getHibernationState();
  assert(typeof snap.hidden === "boolean", "hibernation snapshot");
  assert(isTabHibernating() === snap.hibernating, "isTabHibernating mirrors state");
}

console.log("\n=== 5. Hydration helper export ===");
{
  assert(typeof useClientReady === "function", "useClientReady exported");
}

console.log(`\nconcurrency-idle-part8: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
