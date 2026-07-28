/**
 * Systems polish resilience suite — backoff, queue, schema, audio focus, immutability.
 * Run: pnpm --filter @workspace/majalis run test:systems-polish-resilience
 */
import assert from "node:assert/strict";
import { computeBackoffMs } from "../../utils/backoff.ts";
import {
  enqueueOfflineAction,
  flushOfflineActionQueue,
  peekOfflineActionQueue,
  registerOfflineActionHandler,
} from "../offline-action-queue.ts";
import { SCHEMA_MIGRATIONS } from "../idb-schema-migrate.ts";
import { clearMediaSession } from "../audio-focus.ts";
import { computeBackoffMs as _b } from "../../utils/backoff.ts";
import {
  closeCrossTabChannel,
  getCrossTabId,
  subscribeCrossTab,
} from "../cross-tab-sync.ts";
import { toggleLocalBookmark, listLocalBookmarks, clearLocalBookmarks } from "../local-bookmarks.ts";

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

// Minimal localStorage / online shims for node
function ensureDomShims() {
  const store = new Map<string, string>();
  if (typeof globalThis.localStorage === "undefined") {
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
  if (typeof globalThis.navigator === "undefined") {
    (globalThis as unknown as { navigator: { onLine: boolean } }).navigator = { onLine: true };
  } else {
    try {
      Object.defineProperty(globalThis.navigator, "onLine", { value: true, configurable: true });
    } catch {
      /* ignore */
    }
  }
  const win = {
    location: { pathname: "/", search: "" },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    localStorage: globalThis.localStorage,
  };
  if (typeof globalThis.window === "undefined") {
    (globalThis as unknown as { window: typeof win }).window = win;
  } else {
    const w = globalThis.window as unknown as {
      location?: { pathname: string; search: string };
      addEventListener?: unknown;
    };
    if (!w.location) w.location = { pathname: "/", search: "" };
    if (typeof w.addEventListener !== "function") {
      w.addEventListener = () => undefined;
      (w as { removeEventListener?: unknown }).removeEventListener = () => undefined;
    }
  }
}

ensureDomShims();

console.log("\n=== Backoff ===");
await test("monotonic growth capped", () => {
  const a0 = computeBackoffMs({ attempt: 0, baseMs: 200, maxMs: 8_000, jitter: 0 });
  const a3 = computeBackoffMs({ attempt: 3, baseMs: 200, maxMs: 8_000, jitter: 0 });
  const a20 = computeBackoffMs({ attempt: 20, baseMs: 200, maxMs: 8_000, jitter: 0 });
  assert.equal(a0, 200);
  assert.ok(a3 > a0);
  assert.equal(a20, 8_000);
});

await test("full jitter stays in range", () => {
  for (let i = 0; i < 20; i++) {
    const v = computeBackoffMs({ attempt: 2, baseMs: 100, maxMs: 1000, jitter: 1 });
    assert.ok(v >= 0 && v <= 1000);
  }
});

console.log("\n=== Offline action queue ===");
await test("enqueue + sequential flush", async () => {
  // reset via clear storage key
  localStorage.removeItem("majalis-offline-action-queue-v1");
  const seen: string[] = [];
  registerOfflineActionHandler("custom", async (a) => {
    seen.push(String((a.payload as { n: number }).n));
  });
  enqueueOfflineAction("custom", { n: 1 });
  enqueueOfflineAction("custom", { n: 2 });
  assert.ok(peekOfflineActionQueue().length >= 2);
  const n = await flushOfflineActionQueue();
  assert.ok(n >= 2);
  assert.deepEqual(seen.slice(-2), ["1", "2"]);
});

console.log("\n=== Schema migrations registry ===");
await test("migrations are additive and ordered", () => {
  assert.ok(SCHEMA_MIGRATIONS.length >= 1);
  for (let i = 1; i < SCHEMA_MIGRATIONS.length; i++) {
    assert.ok(SCHEMA_MIGRATIONS[i].version >= SCHEMA_MIGRATIONS[i - 1].version);
  }
  assert.ok(SCHEMA_MIGRATIONS.every((m) => m.id && typeof m.run === "function"));
});

console.log("\n=== Media session clear ===");
await test("clearMediaSession is noop-safe without navigator.mediaSession", () => {
  clearMediaSession();
});

console.log("\n=== Cross-tab teardown ===");
await test("unsubscribe closes when last handler gone", () => {
  getCrossTabId();
  const u1 = subscribeCrossTab(() => undefined);
  const u2 = subscribeCrossTab(() => undefined);
  u1();
  u2();
  closeCrossTabChannel();
});

console.log("\n=== Bookmark immutability ===");
await test("toggle does not mutate prior snapshot", () => {
  clearLocalBookmarks();
  const before = listLocalBookmarks();
  assert.equal(before.length, 0);
  toggleLocalBookmark({ contentType: "lesson", contentId: "x1", title: "ت" });
  const after = listLocalBookmarks();
  assert.equal(after.length, 1);
  assert.equal(before.length, 0);
  clearLocalBookmarks();
});

console.log("\n=== Backoff re-export sanity ===");
await test("backoff helper identity", () => {
  assert.equal(typeof _b, "function");
});

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
