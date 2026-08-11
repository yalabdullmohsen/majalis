/**
 * اختبار تهيئة التشغيل الأول وبنية الإعدادات (الوحدة ٢٣).
 * تشغيل: node --import tsx src/lib/__tests__/first-run-setup-settings.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FIRST_RUN_SETUP_KEY,
  isFirstRunSetupPending,
  markFirstRunSetupDone,
  readFirstRunSetup,
  resetFirstRunSetupForTests,
} from "@/lib/first-run-setup";
import { DEFAULT_PREFERENCES } from "@/lib/user-preferences";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

assert.equal(FIRST_RUN_SETUP_KEY, "majalis-first-run-setup-v1");
assert.equal(DEFAULT_PREFERENCES.seniorMode, false);

{
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
  (globalThis as { localStorage?: typeof ls }).localStorage = ls;

  resetFirstRunSetupForTests();
  assert.equal(isFirstRunSetupPending(), true);
  markFirstRunSetupDone(true);
  assert.equal(isFirstRunSetupPending(), false);
  assert.equal(readFirstRunSetup().skipped, true);
  resetFirstRunSetupForTests();
  assert.equal(isFirstRunSetupPending(), true);
}

const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
assert.doesNotMatch(app, /\b(Onboarding|WelcomeScreen|IntroScreen)\b/);

const brand = readFileSync(resolve(root, "src/components/BrandReveal.tsx"), "utf8");
assert.match(brand, /FirstRunSetup/);
assert.match(brand, /components\/FirstRunSetup/);
assert.doesNotMatch(brand, /\b(Onboarding|WelcomeScreen|IntroScreen)\b/);

const frs = readFileSync(resolve(root, "src/components/FirstRunSetup.tsx"), "utf8");
assert.match(frs, /تخطّي/);
assert.match(frs, /markFirstRunSetupDone/);
assert.match(frs, /لن نطلب إذن الإشعارات/);
assert.doesNotMatch(frs, /Notification\.requestPermission|PushNotifications|requestPermissions/);

const settings = readFileSync(resolve(root, "src/pages/account/ui/SettingsView.tsx"), "utf8");
assert.match(settings, /استعادة الإعدادات الافتراضية/);
assert.match(settings, /restoreDefaultAppSettings/);
assert.match(settings, /settings-search/);
assert.match(settings, /وضع كبار السن/);
assert.match(settings, /القارئ المفضّل/);
assert.match(settings, /التشغيل في الخلفية/);
assert.match(settings, /التحميلات والمساحة/);
assert.match(settings, /البيانات والخصوصية/);

const restore = readFileSync(resolve(root, "src/lib/restore-default-settings.ts"), "utf8");
assert.match(restore, /writeThemePreference\("auto"\)/);
assert.match(restore, /persistTafsirEdition/);

console.log("first-run-setup-settings.test.ts: ok");
