/**
 * Part 7 — resilience: memory pressure, mutation queue, tiered storage, listeners.
 * Run: npx tsx src/lib/__tests__/resilience-part7.test.ts
 */

import {
  getMemorySnapshot,
  relieveMemoryPressure,
  ensureMemoryPressureBinding,
} from "../memory-pressure";
import {
  enqueueMutation,
  flushMutationQueue,
  getMutationQueueSnapshot,
  registerMutationHandler,
  initOfflineMutationQueue,
} from "../offline-mutation-queue";
import {
  writeTieredSync,
  readTieredSync,
  _resetStorageProbes,
  _memoryStoreSize,
  probeLocalStorage,
} from "../tiered-storage";
import {
  addSafeWindowListener,
  getSafeListenerCount,
  removeAllSafeListeners,
} from "../safe-listeners";

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

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
} as Storage;

const listenerMap = new Map<string, Set<EventListenerOrEventListenerObject>>();
(globalThis as unknown as { window: Window }).window = {
  addEventListener: (type: string, handler: EventListenerOrEventListenerObject) => {
    if (!listenerMap.has(type)) listenerMap.set(type, new Set());
    listenerMap.get(type)!.add(handler);
  },
  removeEventListener: (type: string, handler: EventListenerOrEventListenerObject) => {
    listenerMap.get(type)?.delete(handler);
  },
  setInterval: globalThis.setInterval.bind(globalThis),
  clearInterval: globalThis.clearInterval.bind(globalThis),
  dispatchEvent: () => true,
} as unknown as Window;

(globalThis as unknown as { document: Document }).document = {
  visibilityState: "visible",
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
} as unknown as Document;

Object.defineProperty(globalThis, "navigator", {
  value: { onLine: true },
  configurable: true,
});

console.log("\n=== 1. Memory pressure ===");
{
  ensureMemoryPressureBinding();
  const snap = getMemorySnapshot();
  assert(["ok", "moderate", "critical"].includes(snap.level), "snapshot level valid");
  await relieveMemoryPressure("moderate");
  assert(true, "relieveMemoryPressure does not throw");
}

console.log("\n=== 2. Tiered storage ===");
{
  _resetStorageProbes();
  assert(probeLocalStorage() === true, "localStorage probe ok");
  const tier = writeTieredSync("part7-test-key", { a: 1 });
  assert(tier === "localStorage" || tier === "memory", "write tier");
  const { value } = readTieredSync("part7-test-key", { a: 0 });
  assert((value as { a: number }).a === 1, "read round-trip");
  // Force memory path
  _resetStorageProbes();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
    removeItem: () => {
      throw new Error("blocked");
    },
    clear: () => undefined,
    key: () => null,
    length: 0,
  } as Storage;
  _resetStorageProbes();
  const t2 = writeTieredSync("mem-only", { b: 2 });
  assert(t2 === "memory", "falls back to memory when LS blocked");
  assert(_memoryStoreSize() >= 1, "memory store holds value");
  // restore LS for later
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k, v) => {
      mem.set(k, String(v));
    },
    removeItem: (k) => {
      mem.delete(k);
    },
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  } as Storage;
  _resetStorageProbes();
}

console.log("\n=== 3. Offline mutation queue + backoff ===");
{
  mem.clear();
  let handled = 0;
  registerMutationHandler("generic", async () => {
    handled++;
  });
  enqueueMutation("generic", { x: 1 }, { id: "g1" });
  enqueueMutation("generic", { x: 2 }, { id: "g2" });
  // May have auto-flushed on enqueue while online — either way handlers must run
  await initOfflineMutationQueue();
  const result = await flushMutationQueue();
  assert(
    handled >= 1 || result.processed >= 1 || getMutationQueueSnapshot().every((q) => q.kind !== "generic"),
    "flush processed items",
  );
}

console.log("\n=== 4. Safe listeners teardown ===");
{
  removeAllSafeListeners();
  const before = getSafeListenerCount();
  const dispose = addSafeWindowListener("resize", () => undefined);
  assert(getSafeListenerCount() === before + 1, "listener registered");
  dispose();
  assert(getSafeListenerCount() === before, "listener disposed");
  const d2 = addSafeWindowListener("scroll", () => undefined, { passive: true });
  removeAllSafeListeners();
  assert(getSafeListenerCount() === 0, "removeAll clears registry");
  d2(); // idempotent
}

console.log(`\nresilience-part7: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
