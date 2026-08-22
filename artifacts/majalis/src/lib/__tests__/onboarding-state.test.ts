/**
 * بوابة راية الخصوصية فقط — شاشة الدخول الأولى محذوفة.
 */
import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

type Store = Map<string, string>;
let lsStore: Store = new Map();
let lsThrows = false;

function installEnv() {
  lsStore = new Map();
  lsThrows = false;
  const g = globalThis as unknown as Record<string, unknown>;
  g.localStorage = {
    getItem: (k: string) => {
      if (lsThrows) throw new Error("storage disabled");
      return lsStore.has(k) ? lsStore.get(k)! : null;
    },
    setItem: (k: string, v: string) => {
      if (lsThrows) throw new Error("QuotaExceededError");
      lsStore.set(k, v);
    },
    removeItem: (k: string) => {
      if (lsThrows) throw new Error("storage disabled");
      lsStore.delete(k);
    },
  };

  const cookies: Store = new Map();
  g.document = {
    get cookie() {
      return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    set cookie(raw: string) {
      const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      const expired = attrs.some((a) => /^max-age=0$/i.test(a));
      if (expired || value === "") cookies.delete(name);
      else cookies.set(name, value);
    },
  };
}

installEnv();

const mod = await import("../onboarding-state.js");
const {
  initOnboardingState,
  hasSeenStorageNotice,
  markStorageNoticeSeen,
  __resetOnboardingStateForTests,
} = mod;

beforeEach(() => {
  installEnv();
  __resetOnboardingStateForTests();
});

test("راية الخصوصية/الكوكيز تصمد عبر reload", () => {
  initOnboardingState();
  markStorageNoticeSeen();
  initOnboardingState();
  assert.equal(hasSeenStorageNotice(), true);
});

test("الوحدة لا تطلب إذن إشعارات ولا شاشة بدء", async () => {
  const { readFileSync } = await import("node:fs");
  const { resolve, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const src = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "../onboarding-state.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /requestPermission|Notification\s*\.|LocalNotifications|PushNotifications/);
  assert.doesNotMatch(src, /hasSeenOnboarding|markOnboardingSeen|shouldSkipAppStart/);
});

test("إخفاق localStorage لا يمنع كتابة الكوكي للراية", () => {
  initOnboardingState();
  lsThrows = true;
  const durable = markStorageNoticeSeen();
  assert.equal(durable, true);
  assert.equal(hasSeenStorageNotice(), true);
});

test("الوسم idempotent", () => {
  initOnboardingState();
  assert.equal(markStorageNoticeSeen(), true);
  assert.equal(markStorageNoticeSeen(), true);
  assert.equal(hasSeenStorageNotice(), true);
});
