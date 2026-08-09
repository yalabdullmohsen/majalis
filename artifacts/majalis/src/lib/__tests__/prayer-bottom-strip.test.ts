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
  /html\.pts-immersive\s+\.bottom-nav[\s\S]*?background:\s*var\(--mj-brand-deep/,
  "شريط التبويب بنفس زمرد الصفحة (يهزم --mj-surface)",
);
assert.match(
  css,
  /html\.pts-immersive\s+\.bottom-nav--m2030/,
  "يغطي صنف m2030 من theme-aliases",
);
assert.match(
  css,
  /html\.pts-immersive\s+\.top-section-bar[\s\S]*?background:\s*var\(--mj-brand-deep[\s\S]*?!important/,
  "شريط الأقسام زمردي بـ !important",
);
assert.match(
  css,
  /html\.pts-immersive,\s*\nhtml\.pts-immersive body\s*\{[\s\S]*?background-color:\s*var\(--mj-brand-deep\)/,
  "html/body زمرديان تحت الشريط",
);

console.log("prayer-bottom-strip.test.ts: ok");
