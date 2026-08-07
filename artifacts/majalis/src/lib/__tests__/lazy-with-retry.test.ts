/**
 * Simulate Safari / post-deploy dynamic import failure and retry guard.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  CHUNK_RELOAD_KEY,
  clearChunkReloadGuard,
  consumeChunkReloadAllowance,
  isChunkLoadError,
} from "../lazy-with-retry";

const store = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
  value: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  },
  configurable: true,
});

assert.equal(isChunkLoadError(new Error("Importing a module script failed.")), true);
assert.equal(isChunkLoadError(new Error("TypeError: Importing a module script failed")), true);
assert.equal(isChunkLoadError(new Error("Failed to fetch dynamically imported module")), true);
assert.equal(isChunkLoadError(new Error("Loading chunk 5 failed")), true);
assert.equal(isChunkLoadError(new Error("random")), false);

store.clear();
assert.equal(consumeChunkReloadAllowance("HomeUpcomingLessons"), true);
assert.equal(store.get(CHUNK_RELOAD_KEY), "HomeUpcomingLessons");
assert.equal(consumeChunkReloadAllowance("again"), false, "second reload blocked — no loop");
clearChunkReloadGuard();
assert.equal(store.has(CHUNK_RELOAD_KEY), false);

// Simulate the lazyWithRetry catch path: chunk error → one reload allowance → throw
async function simulateLazyFactory(fail: boolean) {
  try {
    if (fail) throw new Error("Importing a module script failed.");
    return { default: () => null };
  } catch (error) {
    if (isChunkLoadError(error)) {
      const allowed = consumeChunkReloadAllowance("sim");
      return { reloaded: allowed, error };
    }
    throw error;
  }
}

store.clear();
const first = await simulateLazyFactory(true);
assert.equal(first.reloaded, true);
const second = await simulateLazyFactory(true);
assert.equal(second.reloaded, false, "prevents reload loop");

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const homeSrc = readFileSync(join(root, "pages/account/ui/HomeView.tsx"), "utf8");
assert.match(homeSrc, /import \{\s*HomeUpcomingLessons\s*\} from "@\/components\/home\/HomeUpcomingLessons"/);
assert.match(homeSrc, /import \{\s*HomeUpcomingCourses\s*\} from "@\/components\/home\/HomeUpcomingCourses"/);
assert.doesNotMatch(
  homeSrc,
  /HomeUpcomingLessons\s*=\s*lazy/,
);
assert.match(homeSrc, /lazyWithRetry/);

const boundary = readFileSync(join(root, "components/ErrorBoundary.tsx"), "utf8");
assert.match(boundary, /SectionErrorBoundary/);
assert.match(boundary, /isChunkLoadError/);
assert.match(boundary, /remountKey/);
assert.match(boundary, /consumeChunkReloadAllowance/);

console.log("lazy-with-retry.test.ts: ok");
