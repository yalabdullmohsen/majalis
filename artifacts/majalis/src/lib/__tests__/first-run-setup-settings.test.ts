/**
 * تشغيل: node --import tsx src/lib/__tests__/first-run-setup-settings.test.ts
 * يغطي: مرة واحدة، تخطّي، استئناف خطوة، إعدادات، بلا إذن إشعارات في الواجهة.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* ── محاكاة تخزين المتصفح قبل استيراد الوحدات ───────────────────────── */
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

const {
  FIRST_RUN_SETUP_KEY,
  getFirstRunResumeStep,
  isFirstRunSetupPending,
  markFirstRunSetupDone,
  markPreferencesStepDone,
  markRemindersStepDone,
  markWelcomeStepDone,
  readFirstRunSetup,
  resetFirstRunSetupForTests,
} = await import("../first-run-setup.js");
const {
  __resetOnboardingStateForTests,
  initOnboardingState,
  shouldShowFirstRunFlow,
} = await import("../onboarding-state.js");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

assert.equal(FIRST_RUN_SETUP_KEY, "majalis-first-run-setup-v1");

function fresh() {
  installEnv();
  __resetOnboardingStateForTests();
  resetFirstRunSetupForTests();
  initOnboardingState();
}

{
  fresh();
  assert.equal(isFirstRunSetupPending(), true, "مستخدم جديد ⇒ التهيئة مستحقّة");
  assert.equal(shouldShowFirstRunFlow(), true);
  assert.equal(getFirstRunResumeStep(), 0);

  markWelcomeStepDone();
  assert.equal(getFirstRunResumeStep(), 1, "بعد ابدأ ⇒ استئناف من التفضيلات");
  assert.equal(isFirstRunSetupPending(), true, "ما زالت التفضيلات/التذكيرات");

  markPreferencesStepDone(true);
  assert.equal(getFirstRunResumeStep(), 2, "بعد تخطّي التفضيلات ⇒ التذكيرات");

  markRemindersStepDone();
  assert.equal(isFirstRunSetupPending(), false, "بعد إنهاء التذكيرات ⇒ لا تهيئة");
  assert.equal(shouldShowFirstRunFlow(), false);
}

{
  fresh();
  markFirstRunSetupDone(true);
  assert.equal(isFirstRunSetupPending(), false);
  assert.equal(readFirstRunSetup().skipped, true);
  // محاكاة reload
  initOnboardingState();
  assert.equal(isFirstRunSetupPending(), false, "تخطّي يصمد عبر reload");
}

{
  fresh();
  markFirstRunSetupDone(false);
  initOnboardingState();
  assert.equal(isFirstRunSetupPending(), false, "إنهاء يصمد عبر reload");
}

{
  fresh();
  markFirstRunSetupDone(true);
  resetFirstRunSetupForTests();
  initOnboardingState();
  assert.equal(isFirstRunSetupPending(), true, "إعادة عرض التهيئة من الإعدادات فقط");
}

const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
assert.doesNotMatch(app, /\b(Onboarding|WelcomeScreen|IntroScreen|BrandReveal)\b/);
assert.match(app, /AppFirstRunHost/);

const host = readFileSync(resolve(root, "src/components/AppFirstRunHost.tsx"), "utf8");
assert.match(host, /FirstRunSetup/);
assert.match(host, /components\/FirstRunSetup/);
assert.doesNotMatch(host, /\b(Onboarding|WelcomeScreen|IntroScreen)\b/);

const frs = readFileSync(resolve(root, "src/components/FirstRunSetup.tsx"), "utf8");
assert.match(frs, /markWelcomeStepDone/);
assert.match(frs, /markPreferencesStepDone/);
assert.match(frs, /markRemindersStepDone/);
assert.match(frs, /webdriver|noFirstRun/);
assert.doesNotMatch(
  frs,
  /requestPermission|Notification\.requestPermission|LocalNotifications\.requestPermissions/,
  "لا طلب إذن نظام من شاشة التهيئة",
);

const settings = readFileSync(resolve(root, "src/pages/account/ui/SettingsView.tsx"), "utf8");
assert.match(settings, /إعادة عرض التهيئة/);
assert.match(settings, /resetFirstRunSetup/);

const cookie = readFileSync(resolve(root, "src/components/CookieConsentBanner.tsx"), "utf8");
assert.match(cookie, /markStorageNoticeSeen/);
assert.match(cookie, /return null/, "لا بانر خصوصية عند التشغيل");
assert.doesNotMatch(cookie, /cookie-consent--subtle/, "أُزيل الشريط المرئي من أول تشغيل");

console.log("first-run-setup-settings.test.ts: ok");
