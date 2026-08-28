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

test("التعريف معطّل عبر الإعداد — لا يظهر عند الإقلاع", () => {
  assert.equal(shouldShowFirstVisitIntro("/"), false);
});

test("مسار غير الرئيسية لا يعرض التعريف", () => {
  assert.equal(shouldShowFirstVisitIntro("/mushaf"), false);
  assert.equal(shouldShowFirstVisitIntro("/fiqh"), false);
});

test("بعد الحفظ لا تعود الصفحة", () => {
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

test("ترحيل ترحيب الرئيسية السابقة", () => {
  lsStore.set("majlis-home-welcomed-v1", "1");
  migrateLegacyFirstVisitIntroKeys();
  assert.equal(hasSeenFirstVisitIntroSync(), true);
});

test("webdriver يتخطى التعريف", () => {
  const desc = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    value: { webdriver: true },
    configurable: true,
  });
  assert.equal(shouldShowFirstVisitIntro("/"), false);
  if (desc) Object.defineProperty(globalThis, "navigator", desc);
});

console.log("first-visit-intro-state.test.ts: ok");
