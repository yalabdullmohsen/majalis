/**
 * بوابة: شاشة الإعدادات تستخدم SettingsList للإجراءات بدل ui-card-btn.
 * node --import tsx src/lib/__tests__/settings-rows-unify-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = readFileSync(resolve(root, "src/pages/account/ui/SettingsView.tsx"), "utf8");

assert.doesNotMatch(src, /\bui-card-btn\b/, "لا ui-card-btn في الإعدادات");
assert.doesNotMatch(src, /\bsettings-danger-btn\b/, "لا settings-danger-btn — صفوف SettingsList");
assert.match(src, /SettingsList/, "SettingsList مستخدم");
assert.match(src, /id:\s*"feature-tour"/, "جولة المزايا ضمن SettingsList");
assert.match(src, /id:\s*"clear-local"/, "مسح المحلي ضمن SettingsList");
assert.match(src, /id:\s*"refresh-version"/, "تحديث النسخة ضمن SettingsList");

const list = readFileSync(resolve(root, "src/components/design-system/SettingsList.tsx"), "utf8");
assert.match(list, /testId/, "SettingsList يدعم testId");

console.log("settings-rows-unify-gate.test.ts: ok");
