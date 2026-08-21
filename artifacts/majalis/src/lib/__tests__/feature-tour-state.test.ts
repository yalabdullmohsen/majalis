/**
 * بوابة جولة المزايا — onboarding.completed.v1 في تخزين دائم.
 * تشغيل: node --import tsx src/lib/__tests__/feature-tour-state.test.ts
 */
import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

type Store = Map<string, string>;
let lsStore: Store = new Map();

function installEnv() {
  lsStore = new Map();
  const g = globalThis as unknown as Record<string, unknown>;
  g.localStorage = {
    getItem: (k: string) => (lsStore.has(k) ? lsStore.get(k)! : null),
    setItem: (k: string, v: string) => {
      lsStore.set(k, v);
    },
    removeItem: (k: string) => {
      lsStore.delete(k);
    },
  };
  g.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

installEnv();

beforeEach(async () => {
  installEnv();
  const mod = await import("../feature-tour-state");
  mod.resetFeatureTourStateForTests();
});

test("FEATURE_TOUR_COMPLETED_KEY is onboarding.completed.v1", async () => {
  const { FEATURE_TOUR_COMPLETED_KEY } = await import("../feature-tour-state");
  assert.equal(FEATURE_TOUR_COMPLETED_KEY, "onboarding.completed.v1");
});

test("markFeatureTourCompleted persists flag", async () => {
  const {
    FEATURE_TOUR_COMPLETED_KEY,
    hasCompletedFeatureTourSync,
    markFeatureTourCompleted,
  } = await import("../feature-tour-state");

  assert.equal(hasCompletedFeatureTourSync(), false);
  markFeatureTourCompleted();
  assert.equal(hasCompletedFeatureTourSync(), true);
  assert.equal(lsStore.get(FEATURE_TOUR_COMPLETED_KEY), "1");
});

test("skip path marks completed (idempotent)", async () => {
  const { markFeatureTourCompleted, hasCompletedFeatureTourSync } = await import("../feature-tour-state");
  markFeatureTourCompleted();
  markFeatureTourCompleted();
  assert.equal(hasCompletedFeatureTourSync(), true);
});

test("native-storage includes tour key", async () => {
  const { NATIVE_PROGRESS_KEYS } = await import("../native-storage");
  assert.ok(NATIVE_PROGRESS_KEYS.includes("onboarding.completed.v1"));
  assert.ok(NATIVE_PROGRESS_KEYS.includes("majalis.onboarding.onboarding_seen"));
});

console.log("feature-tour-state.test.ts: ok");
