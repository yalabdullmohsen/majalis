/**
 * صفحة الصلاة: لا شريط سفلي بلون مختلف تحت التبويبات.
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
  /html\.pts-immersive\s+\.bottom-nav[\s\S]*?background:\s*var\(--em-950/,
  "شريط التبويب بنفس لون أسفل الصفحة",
);
assert.match(css, /html\.pts-immersive\s+\.bottom-nav--m2030/, "يغطي صنف m2030");
assert.match(
  css,
  /html\.pts-immersive\s+\.top-section-bar[\s\S]*?background:\s*var\(--em-950[\s\S]*?!important/,
  "شريط الأقسام موحّد اللون",
);
assert.match(
  css,
  /html\.pts-immersive,\s*\nhtml\.pts-immersive body\s*\{[\s\S]*?background-color:\s*var\(--em-950/,
  "html/body موحّدان تحت الشريط",
);

assert.match(
  css,
  /\.pts-screen(?:\.pts-screen)?--with-nav[\s\S]*?padding-block-start:\s*calc\(\s*var\(--inset-top/,
  "safe-area العلوي على شاشة الصلاة مع الشريط السفلي",
);
assert.match(
  css,
  /\.pts-hero\s*\{[\s\S]*?border-radius:\s*1\.15rem/,
  "بطاقة البطل بزوايا مستديرة",
);
assert.doesNotMatch(
  css,
  /\.pts-screen\s*\{[^}]*margin-block-start:\s*calc\(\s*-1\s*\*\s*var\(--inset-top\)/,
  "لا سحب سالب تحت النوتش",
);

console.log("prayer-bottom-strip.test.ts: ok");
