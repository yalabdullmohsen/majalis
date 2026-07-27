/**
 * scripts/test-safe-reload.mjs — يمنع سباق reload المزدوج.
 */
import assert from "node:assert/strict";

const GUARD_KEY = "majalis-safe-reload-ts";
const GUARD_WINDOW_MS = 4000;
const store = new Map();

function safeLocationReload(reloadFn, now = Date.now()) {
  const raw = store.has(GUARD_KEY) ? store.get(GUARD_KEY) : null;
  if (raw != null) {
    const last = Number(raw);
    if (Number.isFinite(last) && now - last < GUARD_WINDOW_MS) return;
  }
  store.set(GUARD_KEY, String(now));
  reloadFn();
}

let count = 0;
const reload = () => { count += 1; };
safeLocationReload(reload, 1000);
safeLocationReload(reload, 1500);
assert.equal(count, 1, "second reload within window must be ignored");
safeLocationReload(reload, 1000 + GUARD_WINDOW_MS + 1);
assert.equal(count, 2, "reload after window must proceed");
console.log("✓ test-safe-reload: ok");
