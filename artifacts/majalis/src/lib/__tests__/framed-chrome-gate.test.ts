/**
 * بوابة: عناوين/محتوى فارغ/أزرار عائمة لا تُترك بلا إطار.
 * تشغيل: node --import tsx src/lib/__tests__/framed-chrome-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const soft = read("src/styles/soft-cards.css");
const fabCss = read("src/index.css") + "\n" + read("src/styles/final-release.css");
const m2030 = read("src/styles/m2030/pages.css");
const kids = read("src/styles/pages/kids.css");

assert.match(soft, /\.mj-framed/, "أداة mj-framed موجودة");
assert.match(soft, /\.m2030-band/, "أشرطة الأقسام مؤطّرة");
assert.match(soft, /\.ds-empty/, "حالات الفراغ مؤطّرة");
assert.match(soft, /\.global-back-btn/, "زر الرجوع العائم ضمن قاعدة الإطار");
assert.match(soft, /\.floating-back-btn/, "زر الرجوع العائم");
assert.match(soft, /\.scroll-to-top/, "زر أعلى الشاشة مؤطّر");
assert.match(soft, /\.assistant-fab/, "زر المساعد مؤطّر");

assert.match(fabCss, /\.assistant-fab[\s\S]{0,400}border:\s*1px solid/, "assistant-fab له حد");
assert.match(
  fabCss,
  /\.floating-back-btn[\s\S]{0,500}border:\s*1px solid/,
  "floating-back-btn له حد",
);

assert.match(m2030, /\.lesson-unified-card\s*\{[\s\S]*padding:\s*0\s*!important/, "بطاقة الدرس بلا padding يكسر الإطار");
assert.match(m2030, /border-radius:\s*var\(--radius-card,\s*24px\)/, "حواف بطاقة الدرس 24px");

assert.match(kids, /\.kids-hub-intro[\s\S]{0,200}border:\s*1px solid/, "مقدمة ركن الأطفال مؤطّرة");
assert.match(kids, /\.kids-hub-soon__btn[\s\S]{0,200}border:\s*1px solid/, "أزرار ركن الأطفال مؤطّرة");

console.log("framed-chrome-gate.test.ts: ok");
