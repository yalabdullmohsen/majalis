/**
 * بوابة صفحة التعريف عند أول زيارة.
 * node --import tsx src/lib/__tests__/first-visit-intro-state.test.ts
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
  Object.defineProperty(globalThis, "navigator", {
    value: { webdriver: false },
    configurable: true,
  });
}

installEnv();

const mod = await import("../first-visit-intro-state.js");
const {
  FIRST_VISIT_INTRO_STORAGE_KEY,
  migrateLegacyFirstVisitIntroKeys,
  hasSeenFirstVisitIntroSync,
  markFirstVisitIntroSeen,
  shouldShowFirstVisitIntro,
  resetFirstVisitIntroStateForTests,
} = mod;

beforeEach(() => {
  installEnv();
  resetFirstVisitIntroStateForTests();
});

test("التعريف مفعّل — يُعرض على الرئيسية للمستخدم الجديد", () => {
  assert.equal(shouldShowFirstVisitIntro("/"), true);
});

test("مسار غير الرئيسية لا يعرض التعريف", () => {
  assert.equal(shouldShowFirstVisitIntro("/mushaf"), false);
  assert.equal(shouldShowFirstVisitIntro("/fiqh"), false);
});

test("بعد الحفظ لا يُعرض مرة ثانية", () => {
  markFirstVisitIntroSeen();
  assert.equal(hasSeenFirstVisitIntroSync(), true);
  assert.equal(shouldShowFirstVisitIntro("/"), false);
  assert.equal(lsStore.get(FIRST_VISIT_INTRO_STORAGE_KEY), "true");
});

test("ترحيل المفاتيح القديمة قبل المسح", () => {
  lsStore.set("majalis-intro-seen", "1");
  migrateLegacyFirstVisitIntroKeys();
  assert.equal(hasSeenFirstVisitIntroSync(), true);
  assert.equal(shouldShowFirstVisitIntro("/"), false);
});

test("ترحيل ترحيب الرئيسية القديم", () => {
  lsStore.set("majlis-home-welcomed-v1", "1");
  migrateLegacyFirstVisitIntroKeys();
  assert.equal(hasSeenFirstVisitIntroSync(), true);
});

test("webdriver يتخطى التعريف", () => {
  Object.defineProperty(globalThis, "navigator", {
    value: { webdriver: true },
    configurable: true,
  });
  assert.equal(shouldShowFirstVisitIntro("/"), false);
});

console.log("first-visit-intro-state.test.ts: ok");
