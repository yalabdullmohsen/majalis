/**
 * بوابة: صفحة دخول مستقلة مدمجة — تبويبان + أيقونة App + إخفاء chrome.
 * تشغيل: node --import tsx src/lib/__tests__/login-auth-redesign-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const login = read("src/pages/account/ui/LoginView.tsx");
const css = read("src/styles/pages/auth.css");
const app = read("src/App.tsx");
const immersive = read("src/lib/immersive-chrome.ts");
const fab = read("src/components/FloatingBackButton.tsx");
const msgs = read("src/lib/auth-messages.ts");
const register = read("src/pages/account/ui/RegisterView.tsx");

assert.match(immersive, /isAuthStandalonePath/);
assert.match(app, /isAuthStandalonePath/);
assert.match(app, /onAuthStandalone/);
assert.match(fab, /isAuthStandalonePath/);

assert.match(login, /login-app-icon/);
assert.match(login, /border-radius:\s*32px|login-app-icon/);
assert.match(login, /علم نافع، محتوى موثوق، ودروس ميسّرة/);
assert.match(login, /تسجيل الدخول/);
assert.match(login, /إنشاء حساب/);
assert.match(login, /المتابعة كزائر/);
assert.match(login, /نسيت كلمة المرور/);
assert.match(login, /sanitizeAuthNext/);
assert.match(login, /resetPasswordForEmail/);
assert.match(login, /register\(/);
assert.match(login, /login-tabs/);
assert.match(login, /القرآن/);
assert.match(login, /الدروس/);
assert.match(login, /الفقه/);
assert.match(login, /الصلاة/);
assert.match(login, /\/brand\/icon-1024\.png/);

assert.match(css, /border-radius:\s*28px/);
assert.match(css, /border-radius:\s*32px/);
assert.match(css, /object-fit:\s*cover/);
assert.match(css, /\.login-tab\.is-active/);
assert.doesNotMatch(css, /linear-gradient\(160deg,\s*var\(--mj-brand-deep\)/);

assert.match(msgs, /البريد غير صحيح/);
assert.match(msgs, /كلمة المرور قصيرة/);
assert.match(msgs, /كلمة المرور غير متطابقة/);
assert.match(msgs, /الحساب غير موجود/);

assert.match(register, /LoginView/);

console.log("login-auth-redesign-gate.test.ts: ok");
