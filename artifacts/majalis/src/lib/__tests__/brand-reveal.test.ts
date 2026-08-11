/**
 * بوابة كشف هوية الدخول.
 * تشغيل: node --import tsx src/lib/__tests__/brand-reveal.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const component = readFileSync(resolve(root, "components/BrandReveal.tsx"), "utf8");
assert.match(component, /export function BrandReveal/);
assert.match(component, /\/brand\/splash-logo\.png/);
assert.match(component, /sessionStorage/);
assert.match(component, /prefers-reduced-motion/);
assert.doesNotMatch(component, /\bmj-boot-splash\b/);
assert.doesNotMatch(component, /\b(Onboarding|WelcomeScreen|IntroScreen)\b/);

const css = readFileSync(resolve(root, "styles/components/brand-reveal.css"), "utf8");
assert.match(css, /#002b21/);
assert.match(css, /mj-br-focus/);
assert.match(css, /mj-br-sweep/);
assert.match(css, /mj-br-curtain/);

const app = readFileSync(resolve(root, "App.tsx"), "utf8");
assert.match(app, /<BrandReveal>/);
assert.match(app, /<\/BrandReveal>/);

console.log("brand-reveal.test.ts: ok");
