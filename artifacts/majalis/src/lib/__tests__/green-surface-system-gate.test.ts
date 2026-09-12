/**
 * بوابة Neutral Surface System — البطاقة العادية محايدة؛ الأخضر للـHero فقط.
 * تشغيل: node --import tsx src/lib/__tests__/green-surface-system-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const tokens = read("src/styles/design-tokens.css");
const green = read("src/styles/green-surface-system.css");
const main = read("src/main.tsx");
const calm = read("src/styles/sections-calm-polish.css");
const unify = read("src/styles/ssunnah-card-unify.css");

assert.match(tokens, /--surface-content:/, "token surface-content");
assert.match(tokens, /--surface-feature:\s*var\(--surface-content\)/, "feature = content محايد");
assert.match(tokens, /--surface-feature-hero:/, "hero أخضر غامق منفصل");
assert.match(tokens, /Neutral Surface System/, "تعليق النظام المحايد");

assert.match(green, /Neutral Surface System/, "ملف الأسطح المحايدة");
assert.match(green, /--surface-content:/, "رمز سطح محايد");
assert.match(green, /\.gs-surface--feature/, "variant مميز اختياري");
assert.match(green, /border-inline-start:\s*1px\s+solid\s+var\(--surface-content-border\)/, "لا حافة خضراء سميكة افتراضيًا");
assert.match(green, /html\.dark|data-theme="dark"/, "وضع ليلي للأسطح");
assert.match(green, /prophet-lux-card::before/, "إزالة لمعات بطاقات الأنبياء");

assert.match(main, /green-surface-system\.css/, "main يستورد نظام الأسطح");

assert.match(unify, /--surface-content/, "توحيد البطاقات على سطح محايد");
assert.doesNotMatch(
  unify,
  /border-inline-start:\s*3px\s+solid/,
  "unify بلا شريط أخضر سميك",
);

assert.doesNotMatch(
  calm,
  /border-inline-start:\s*3px\s+solid\s+var\(--surface-feature-accent/,
  "calm polish لا يعيد الشريط الأخضر السميك",
);
assert.match(calm, /--surface-content/, "calm polish يستخدم السطح المحايد");

console.log("green-surface-system-gate.test.ts: ok");
