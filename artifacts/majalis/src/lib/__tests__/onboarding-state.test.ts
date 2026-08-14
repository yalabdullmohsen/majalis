/**
 * بوابة التشغيل الأول — بعد إلغاء الدليل السريع:
 * shouldShowFirstRunFlow / isOnboardingPending دائمًا false،
 * مع بقاء رايات الخصوصية/الكوكي تعمل.
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
  hasCompletedPreferences,
  markPreferencesCompleted,
  markPreferencesSkipped,
  hasSeenReminderPrompt,
  markReminderPromptSeen,
  hasSeenStorageNotice,
  markStorageNoticeSeen,
  isOnboardingPending,
  shouldShowFirstRunFlow,
  resetOnboardingForDisplay,
  resetOnboardingForSettingsOnly,
  __resetOnboardingStateForTests,
} = mod;

beforeEach(() => {
  installEnv();
  __resetOnboardingStateForTests();
});

test("الدليل السريع ملغى — لا تهيئة مستحقة أبدًا", () => {
  initOnboardingState();
  assert.equal(isOnboardingPending(), false);
  assert.equal(shouldShowFirstRunFlow(), false);
  resetOnboardingForDisplay();
  resetOnboardingForSettingsOnly();
  assert.equal(isOnboardingPending(), false);
  assert.equal(shouldShowFirstRunFlow(), false);
});

test("رايات التفضيلات/الخصوصية ما زالت تُكتب وتُقرأ", () => {
  initOnboardingState();
  markOnboardingSeen();
  markPreferencesCompleted();
  markReminderPromptSeen();
  markStorageNoticeSeen();
  assert.equal(hasSeenOnboarding(), true);
  assert.equal(hasCompletedPreferences(), true);
  assert.equal(hasSeenReminderPrompt(), true);
  assert.equal(hasSeenStorageNotice(), true);
  assert.equal(shouldShowFirstRunFlow(), false);
});

test("تخطّي التفضيلات يُسجَّل ويصمد عبر reload", () => {
  initOnboardingState();
  markOnboardingSeen();
  markPreferencesSkipped();
  markReminderPromptSeen();
  initOnboardingState();
  assert.equal(hasSeenOnboarding(), true);
  assert.equal(hasCompletedPreferences(), true);
  assert.equal(shouldShowFirstRunFlow(), false);
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
});

test("إخفاق localStorage لا يمنع كتابة الكوكي للرايات", () => {
  initOnboardingState();
  lsThrows = true;
  const durable = markOnboardingSeen();
  markPreferencesCompleted();
  markReminderPromptSeen();
  assert.equal(durable, true);
  assert.equal(hasSeenOnboarding(), true);
  assert.equal(shouldShowFirstRunFlow(), false);
});

test("الوسم idempotent", () => {
  initOnboardingState();
  assert.equal(markStorageNoticeSeen(), true);
  assert.equal(markStorageNoticeSeen(), true);
  assert.equal(hasSeenStorageNotice(), true);
  assert.equal(hasSeenReminderPrompt(), false);
});
