/**
 * مضيف التهيئة الأولى — بلا كشف شعار.
 * تشغيل: node --import tsx src/lib/__tests__/app-first-run-host.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

assert.ok(!existsSync(resolve(root, "components/BrandReveal.tsx")), "BrandReveal محذوف");
assert.ok(!existsSync(resolve(root, "styles/components/brand-reveal.css")), "CSS الكشف محذوف");

const component = readFileSync(resolve(root, "components/AppFirstRunHost.tsx"), "utf8");
assert.match(component, /export function AppFirstRunHost/);
assert.match(component, /components\/FirstRunSetup/);
assert.doesNotMatch(component, /splash-logo/);
assert.doesNotMatch(component, /mj-brand-reveal/);
assert.doesNotMatch(component, /sessionStorage/);
assert.doesNotMatch(component, /\b(Onboarding|WelcomeScreen|IntroScreen)\b/);

const app = readFileSync(resolve(root, "App.tsx"), "utf8");
assert.match(app, /<AppFirstRunHost>/);
assert.match(app, /<\/AppFirstRunHost>/);
assert.doesNotMatch(app, /BrandReveal/);

console.log("app-first-run-host.test.ts: ok");
