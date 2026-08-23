/**
 * node --import tsx src/lib/__tests__/homepage-ad-dismiss.test.ts
 */
import assert from "node:assert/strict";
import { dismissHomepageAd, isHomepageAdDismissed } from "../homepage-ad-dismiss";

const store = new Map<string, string>();

// @ts-expect-error — محاكاة بيئة المتصفح في Node
globalThis.window = globalThis;

// @ts-expect-error — محاكاة localStorage في Node
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
  key: () => null,
  length: 0,
};

store.clear();
assert.equal(isHomepageAdDismissed(), false);

dismissHomepageAd();
assert.equal(isHomepageAdDismissed(), true);

store.set("mj-homepage-ad-dismissed-at-v1", String(Date.now() - 25 * 60 * 60 * 1000));
assert.equal(isHomepageAdDismissed(), false);

console.log("homepage-ad-dismiss.test.ts: ok");
