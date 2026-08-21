/**
 * بوابة حالة الدخول الأولى + راية الخصوصية: قراءة/كتابة موثوقة تصمد
 * عبر reload وإخفاق localStorage، مرة واحدة فقط لكل مستخدم.
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
  hasSeenOnboarding,
  markOnboardingSeen,
  hasSeenStorageNotice,
  markStorageNoticeSeen,
  shouldSkipAppStartForPath,
  __resetOnboardingStateForTests,
} = mod;

beforeEach(() => {
  installEnv();
  __resetOnboardingStateForTests();
});

test("مستخدم جديد لم يرَ شاشة الدخول بعد", () => {
  initOnboardingState();
  assert.equal(hasSeenOnboarding(), false);
});

test("الوسم يصمد عبر reload (نفس المفتاح)", () => {
  initOnboardingState();
  markOnboardingSeen();
  initOnboardingState();
  assert.equal(hasSeenOnboarding(), true);
});

test("راية الخصوصية/الكوكيز تعمل باستقلال عن راية الدخول", () => {
  initOnboardingState();
  markStorageNoticeSeen();
  assert.equal(hasSeenStorageNotice(), true);
  assert.equal(hasSeenOnboarding(), false);
});

test("الوحدة لا تطلب إذن إشعارات", async () => {
  const { readFileSync } = await import("node:fs");
  const { resolve, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const src = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "../onboarding-state.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /requestPermission|Notification\s*\.|LocalNotifications|PushNotifications/);
  assert.match(src, /navigator\.webdriver/);
});

test("إخفاق localStorage لا يمنع كتابة الكوكي للراية", () => {
  initOnboardingState();
  lsThrows = true;
  const durable = markOnboardingSeen();
  assert.equal(durable, true);
  assert.equal(hasSeenOnboarding(), true);
});

test("الوسم idempotent", () => {
  initOnboardingState();
  assert.equal(markOnboardingSeen(), true);
  assert.equal(markOnboardingSeen(), true);
  assert.equal(hasSeenOnboarding(), true);
});

test("الروابط العميقة تتخطى الدخولية", () => {
  assert.equal(shouldSkipAppStartForPath("/"), false);
  assert.equal(shouldSkipAppStartForPath("/settings"), false);
  assert.equal(shouldSkipAppStartForPath("/mushaf"), true);
  assert.equal(shouldSkipAppStartForPath("/mushaf?page=2"), true);
  assert.equal(shouldSkipAppStartForPath("/fiqh/books/taharah/lessons/taharah-miyah-aqsam"), true);
  assert.equal(shouldSkipAppStartForPath("/search?q=صلاة"), true);
  assert.equal(shouldSkipAppStartForPath("/lessons/1"), true);
});

test("رفع الإصدار الكبير فقط يعيد التعيين — reload عادي لا يمسّه", () => {
  initOnboardingState();
  markOnboardingSeen();
  markStorageNoticeSeen();
  initOnboardingState();
  initOnboardingState();
  assert.equal(hasSeenOnboarding(), true);
  assert.equal(hasSeenStorageNotice(), true);
});
