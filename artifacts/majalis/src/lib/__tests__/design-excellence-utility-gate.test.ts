/**
 * بوابة برنامج التصميم Premium للصفحات الثانوية/الخدمية.
 * Run: node --import tsx src/lib/__tests__/design-excellence-utility-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const mur = readFileSync(resolve(root, "src/styles/modern-ui-refresh.css"), "utf8");
const support = readFileSync(resolve(root, "src/views/SupportPage.tsx"), "utf8");
const supportCss = readFileSync(resolve(root, "src/styles/pages/support.css"), "utf8");
const settings = readFileSync(resolve(root, "src/styles/pages/settings.css"), "utf8");

assert.match(mur, /Design Excellence/, "كتلة Design Excellence في modern-ui-refresh");
assert.match(mur, /--mur-ink-secondary/, "تباين نصوص ثانوية أوضح");
assert.match(mur, /\.legal-section p/, "طباعة الصفحات القانونية");
assert.match(mur, /\.ds-empty/, "حالات فارغة");
assert.match(mur, /settings-page \.legal-section h2/, "عناوين أقسام الإعدادات");
assert.match(mur, /prefers-reduced-motion/, "احترام تقليل الحركة");
assert.doesNotMatch(mur, /\[data-scripture\]\s*\{[^}]*opacity:\s*0/, "لا إضعاف نصوص المصحف");

assert.match(support, /SUPPORT_FAQ|أسئلة شائعة/);
assert.match(support, /طرق التواصل/);
assert.match(supportCss, /\.support-page__faq/);
assert.match(settings, /font-size: 0\.92rem/, "نص بطاقة الحساب أوضح");

console.log("design-excellence-utility-gate.test.ts: ok");
