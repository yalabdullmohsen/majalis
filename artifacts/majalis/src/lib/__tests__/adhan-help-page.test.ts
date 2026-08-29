/**
 * بوابة صفحة مساعدة الأذان.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-help-page.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const help = readFileSync(resolve(root, "src/pages/worship/ui/AdhanHelpView.tsx"), "utf8");
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8") + "\n" + readFileSync(resolve(root, "src/AppRoutes.tsx"), "utf8");
const routes = readFileSync(resolve(root, "src/app/router/routes.ts"), "utf8");

assert.ok(existsSync(resolve(root, "src/pages/worship/AdhanHelpPage.tsx")));
assert.match(help, /مساعدة الأذان والتنبيهات/);
assert.match(help, /التنبيهات لا تعمل/);
assert.match(help, /التنبيهات تعمل بدون صوت/);
assert.match(help, /الأذان غير كامل/);
assert.match(help, /التنبيهات تتوقف بعد فترة/);
assert.match(help, /تحديث الخلفية معطل/);
assert.match(help, /مواقيت الصلاة غير دقيقة/);
assert.match(help, /صوت الأذان ضعيف/);
assert.match(help, /لا يسمح غالبًا بصوت إشعار طويل/);
assert.match(app, /\/adhan-help/);
assert.match(routes, /\/adhan-help/);

console.log("adhan-help-page.test.ts: ok");
