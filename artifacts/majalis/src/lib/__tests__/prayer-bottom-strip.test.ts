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
  /html\.pts-immersive[\s\S]*?linear-gradient\(180deg,\s*#0f4a38\s+0%,\s*#083528\s+55%,\s*#06271f\s+100%\)/,
  "تدرّج موحّد على html/body/#root",
);
assert.match(css, /html\.pts-immersive\s+\.bottom-nav--m2030/, "يغطي صنف m2030");
assert.match(
  css,
  /html\.pts-immersive\s+\.top-section-bar[\s\S]*?background:\s*#06271f[\s\S]*?!important/,
  "شريط الأقسام موحّد اللون",
);
assert.match(
  css,
  /html\.pts-immersive,\s*\nhtml\.pts-immersive body,\s*\nhtml\.pts-immersive #root/,
  "html/body/#root موحّدان تحت الشريط",
);
assert.match(
  css,
  /html\.pts-immersive #root[\s\S]*?background-color:\s*#06271f/,
  "#root مطلي بزمرد الصلاة لا --app-bg",
);
assert.doesNotMatch(
  css,
  /\.pts-sheet-close[\s\S]{0,200}position:\s*sticky/,
  "لا زر إغلاق ثابت يسحب فجوة فوق التنقّل",
);
assert.doesNotMatch(
  css,
  /\.pts-sheet-close/,
  "لا زر إغلاق ثابت في صفحة الصلاة",
);

assert.match(
  css,
  /\.pts-screen(?:\.pts-screen)?--with-nav[\s\S]*?padding-block-start:\s*max\(\s*12px,\s*var\(--inset-top/,
  "safe-area العلوي عبر --inset-top (≥12px) على شاشة الصلاة",
);
assert.match(
  css,
  /\.pts-hero\s*\{[\s\S]*?border-radius:\s*var\(--pts-radius,\s*22px\)/,
  "بطاقة البطل بزوايا ناعمة (22px)",
);
assert.doesNotMatch(
  css,
  /\.pts-screen\s*\{[^}]*margin-block-start:\s*calc\(\s*-1\s*\*\s*var\(--inset-top\)/,
  "لا سحب سالب تحت النوتش",
);

assert.doesNotMatch(
  css,
  /\.pts-screen\s*\{[^}]*linear-gradient/,
  "خلفية الشاشة شفافة — التدرّج على html/body/#root",
);
assert.match(
  css,
  /html\.pts-immersive[\s\S]*?linear-gradient\(180deg,\s*#0f4a38\s+0%,\s*#083528\s+55%,\s*#06271f\s+100%\)/,
);
assert.match(css, /\.pts-screen\s*\{[\s\S]*?width:\s*100vw/);
assert.match(css, /\.pts-screen\s*\{[\s\S]*?background:\s*transparent/);
assert.match(css, /\.pts-row\s*\{[\s\S]*?border-radius:\s*var\(--pts-radius/);
assert.match(css, /\.pts-dock__item\s*\{[\s\S]*?border-radius:\s*var\(--pts-radius-sm/);
assert.match(css, /padding-bottom:\s*calc\(\s*118px\s*\+\s*var\(--inset-bottom/);
assert.match(css, /var\(--inset-top/);
assert.match(css, /var\(--inset-bottom/);
assert.doesNotMatch(css, /env\(\s*safe-area-inset/);

console.log("prayer-bottom-strip.test.ts: ok");
