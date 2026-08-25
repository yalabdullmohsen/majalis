/**
 * بوابة Apple 5.1.1(v) — حذف الحساب من داخل التطبيق + تأكيد + مسح بيانات.
 * node --import tsx src/lib/__tests__/apple-account-deletion-5-1-1-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const handler = readFileSync(resolve(root, "lib/api-handlers/account/delete.js"), "utf8");
const settings = readFileSync(resolve(root, "src/pages/account/ui/SettingsView.tsx"), "utf8");
const view = readFileSync(resolve(root, "src/pages/account/ui/AccountDeletionView.tsx"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const manifest = readFileSync(resolve(root, "public/manifest.webmanifest"), "utf8");
const cap = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");
const eslintCfg = readFileSync(resolve(root, "eslint.config.js"), "utf8");

assert.match(handler, /wipeOwnedUserData|USER_OWNED_TABLES/, "مسح جداول المستخدم صراحة");
assert.match(handler, /admin\.auth\.admin\.deleteUser/, "حذف Auth");
assert.match(handler, /profiles/, "يشمل profiles");
assert.match(handler, /bookmarks/, "يشمل bookmarks");

assert.match(settings, /settings-delete-account|settings_delete_account/, "مدخل حذف في الإعدادات");
assert.match(settings, /role="alertdialog"/, "حوار تأكيد في الإعدادات");
assert.match(settings, /account-deletion\?confirm=1/, "ينتقل لصفحة الحذف النهائي");
assert.match(settings, /لا يمكن التراجع/, "تحذير عدم القابلية للتراجع");

assert.match(view, /confirmWord !== "حذف"/, "تأكيد كتابي");
assert.match(view, /\/api\/account\/delete/, "يستدعي API الحذف");
assert.match(view, /clearUserLocalDataAndMedia/, "مسح محلي");
assert.match(view, /confirm=1/, "يدعم الدخول المباشر للتأكيد");
assert.match(view, /ليس كمسار وحيد للحذف/, "التواصل ليس المسار الوحيد");

assert.match(html, /viewport-fit=cover/, "viewport-fit لـ Safe Area");
assert.match(html, /apple-mobile-web-app-capable/, "PWA Apple");
assert.match(html, /--inset-top:\s*env\(safe-area-inset-top/, "CSS Safe Area");
assert.match(html, /display-mode:\s*standalone/, "تحسين standalone");

assert.match(manifest, /"display":\s*"standalone"/);
assert.match(cap, /contentInset:\s*"never"/, "Safe Area عبر CSS لا UIKit مزدوج");
assert.match(eslintCfg, /console\.log|no-restricted-syntax.*log/, "منع console.log في الإنتاج");

console.log("apple-account-deletion-5-1-1-gate.test.ts: ok");
