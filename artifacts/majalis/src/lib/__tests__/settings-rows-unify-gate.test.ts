/**
 * بوابة: شاشات الإعدادات (عامة / إشعارات / أذان) على soft-card وصفوف SettingsList.
 * node --import tsx src/lib/__tests__/settings-rows-unify-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function surfaceBlock(css: string, selector: string): string {
  const escaped = selector.replace(".", "\\.");
  const re = new RegExp(`${escaped}\\s*\\{[\\s\\S]*?\\n\\}`);
  const m = css.match(re);
  assert.ok(m, `كتلة ${selector} موجودة`);
  return m[0];
}

const settings = readFileSync(resolve(root, "src/pages/account/ui/SettingsView.tsx"), "utf8");
assert.doesNotMatch(settings, /\bui-card-btn\b/, "لا ui-card-btn في الإعدادات");
assert.doesNotMatch(settings, /\bsettings-danger-btn\b/, "لا settings-danger-btn — صفوف SettingsList");
assert.match(settings, /SettingsList/, "SettingsList مستخدم");
assert.match(settings, /id:\s*"feature-tour"/, "جولة المزايا ضمن SettingsList");
assert.match(settings, /id:\s*"clear-local"/, "مسح المحلي ضمن SettingsList");
assert.match(settings, /id:\s*"refresh-version"/, "تحديث النسخة ضمن SettingsList");
assert.match(settings, /soft-card soft-card--on-light settings-account-card/, "بطاقة الحساب soft-card");

const notif = readFileSync(resolve(root, "src/pages/account/ui/NotificationSettingsView.tsx"), "utf8");
assert.match(notif, /soft-card soft-card--on-light notif-card/, "إشعارات: soft-card");
assert.equal((notif.match(/className="notif-card"/g) || []).length, 0, "لا notif-card بلا soft-card");

const adhan = readFileSync(resolve(root, "src/pages/worship/ui/AdhanSettingsView.tsx"), "utf8");
assert.match(adhan, /soft-card soft-card--on-light ads-card/, "أذان: soft-card");
assert.equal((adhan.match(/className="ads-card"/g) || []).length, 0, "لا ads-card بلا soft-card");

const prayer = readFileSync(resolve(root, "src/components/adhan/PrayerAlertSettingsCard.tsx"), "utf8");
assert.match(prayer, /soft-card soft-card--on-light ads-card/, "تنبيه الصلاة: soft-card");

assert.match(settings, /SettingsToggleRow|SettingsList/, "صفوف التبديل/القائمة من design-system");
assert.match(settings, /id:\s*`theme-\$\{option\.id\}`|id:\s*"theme-/, "اختيار السمة عبر SettingsList");
assert.doesNotMatch(settings, /settings-option-grid/, "لا شبكة اختيار سمة قديمة");
assert.doesNotMatch(settings, /className="settings-toggle-row"/, "لا settings-toggle-row مباشر");

const list = readFileSync(resolve(root, "src/components/design-system/SettingsList.tsx"), "utf8");
assert.match(list, /testId/, "SettingsList يدعم testId");
assert.match(list, /SettingsToggleRow/, "SettingsToggleRow مُصدَّر");

const notifCss = readFileSync(resolve(root, "src/styles/pages/notifications.css"), "utf8");
assert.doesNotMatch(surfaceBlock(notifCss, ".notif-card"), /background\s*:/, "notif-card بلا background خاص");

const adsCss = readFileSync(resolve(root, "src/styles/pages/adhan-settings.css"), "utf8");
assert.doesNotMatch(surfaceBlock(adsCss, ".ads-card"), /background\s*:/, "ads-card بلا background خاص");

const settingsCss = readFileSync(resolve(root, "src/styles/pages/settings.css"), "utf8");
assert.doesNotMatch(surfaceBlock(settingsCss, ".settings-account-card"), /background\s*:/, "settings-account-card بلا خلفية كريمية");


for (const block of notifCss.match(/\.notif-card\s*\{[\s\S]*?\n\}/g) || []) {
  assert.doesNotMatch(block, /background\s*:/, "كل كتل .notif-card بلا background");
}

assert.match(notif, /SettingsToggleRow/, "إشعارات: SettingsToggleRow");
assert.doesNotMatch(notif, /\bnotif-toggle\b/, "إشعارات: لا notif-toggle مخصّص");
assert.doesNotMatch(notif, /function ToggleRow/, "إشعارات: لا ToggleRow محلي");

assert.match(adhan, /SettingsToggleRow/, "أذان: SettingsToggleRow");
assert.doesNotMatch(adhan, /\bads-toggle\b/, "أذان: لا ads-toggle مخصّص");
assert.doesNotMatch(adhan, /function Toggle\(/, "أذان: لا Toggle محلي");

assert.match(prayer, /SettingsToggleRow/, "تنبيه الصلاة: SettingsToggleRow");
assert.doesNotMatch(prayer, /function MiniToggle/, "تنبيه الصلاة: لا MiniToggle");
assert.doesNotMatch(prayer, /\bads-toggle\b/, "تنبيه الصلاة: لا ads-toggle");

console.log("settings-rows-unify-gate.test.ts: ok");
