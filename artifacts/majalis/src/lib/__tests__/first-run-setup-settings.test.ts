/**
 * بوابة: الدليل السريع / FirstRunSetup أُلغي بالكامل.
 * node --import tsx src/lib/__tests__/first-run-setup-settings.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const { isFirstRunSetupPending } = await import("../first-run-setup.js");
const { shouldShowFirstRunFlow } = await import("../onboarding-state.js");

assert.equal(shouldShowFirstRunFlow(), false, "الدليل السريع لا يُعرض أبدًا");
assert.equal(isFirstRunSetupPending(), false, "لا تهيئة أول دخول مستحقة");

const app = readFileSync(resolve(root, "App.tsx"), "utf8");
assert.doesNotMatch(app, /AppFirstRunHost|FirstRunSetup/, "App بلا مضيف الدليل");

assert.equal(existsSync(resolve(root, "components/FirstRunSetup.tsx")), false, "حُذف FirstRunSetup.tsx");
assert.equal(existsSync(resolve(root, "components/AppFirstRunHost.tsx")), false, "حُذف AppFirstRunHost.tsx");
assert.equal(existsSync(resolve(root, "styles/pages/first-run-setup.css")), false, "حُذف CSS الدليل");

const settings = readFileSync(resolve(root, "pages/account/ui/SettingsView.tsx"), "utf8");
assert.doesNotMatch(settings, /resetFirstRunSetup|إعادة عرض التهيئة|دليل أول دخول/, "لا زر إعادة عرض في الإعدادات");

console.log("first-run-setup-settings.test.ts: ok — الدليل السريع ملغى");
