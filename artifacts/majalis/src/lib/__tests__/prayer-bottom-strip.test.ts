/**
 * صفحة الصلاة: لا شريط سفلي بلون مختلف تحت التبويبات (safe-area شفاف/زمردي).
 * تشغيل: node --import tsx src/lib/__tests__/prayer-bottom-strip.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const css = readFileSync(resolve(appRoot, "src/styles/pages/prayer-times.css"), "utf8");

assert.match(
  css,
  /html\.pts-immersive\s+\.bottom-nav[\s\S]*?background:\s*transparent\s*!important/,
  "شريط التبويب شفاف فوق خلفية الصفحة",
);
assert.match(
  css,
  /html\.pts-immersive,\s*\nhtml\.pts-immersive body\s*\{[\s\S]*?background-color:\s*var\(--mj-brand-deep\)/,
  "html/body زمرديان تحت الشريط",
);
assert.equal(
  /html\.pts-immersive\s+\.bottom-nav[\s\S]*?--color-surface/.test(css),
  false,
  "بلا سطح فاتح على شريط الصلاة",
);

console.log("prayer-bottom-strip.test.ts: ok");
