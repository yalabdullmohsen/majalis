/**
 * بوابة b049: أندلس/عثماني + إغلاق روابط المصطلحات المكسورة.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b049-andalus-ottoman-glossary-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const andalus = readFileSync(resolve(root, "src/data/islamic-history/andalus.json"), "utf8");
const ottoman = readFileSync(resolve(root, "src/data/islamic-history/ottoman.json"), "utf8");
const glossary = readFileSync(
  resolve(root, "src/pages/account/ui/IslamicGlossaryView.tsx"),
  "utf8",
);

assert.doesNotMatch(andalus, /وزنجية|وول إلى|ذي النونين|بنى قصر الزهراء/, "لا بقايا تشويه أندلسي");
assert.match(andalus, /القوات القوطية/, "قوط لا وزن");
assert.match(andalus, /وصل إلى الأندلس/, "وصل لا وول");
assert.match(andalus, /الحاجب المنصور|المنصور محمد بن أبي عامر/, "المنصور بن أبي عامر");
assert.match(andalus, /مدينة الزهراء|الزهراء/, "الزهراء مرتبطة بالناصر");

assert.doesNotMatch(
  ottoman,
  /الينابير|روضة الرومان|تاريخ الطبيب|كمالباشي|الهابسبورين/,
  "لا مصادر/ألفاظ مشوّهة عثمانية",
);
assert.match(ottoman, /الإنكشارية/, "الإنكشارية");
assert.match(ottoman, /آل هابسبورغ|هابسبورغ/, "هابسبورغ");
assert.match(ottoman, /الشقائق النعمانية/, "مصدر شقائق");
assert.doesNotMatch(ottoman, /تاريخ الطبري/, "الطبري ليس مصدر تدهور عثماني");

for (const t of ["الحج", "البيع", "الطلاق", "القصاص", "مكة المكرمة", "المعجزة", "السنة القولية"]) {
  assert.match(glossary, new RegExp(`term: "${t}"`), t);
}

const terms = new Set([...glossary.matchAll(/term:\s*"([^"]+)"/g)].map((m) => m[1]));
let missing = 0;
for (const m of glossary.matchAll(/related:\s*\[([^\]]*)\]/g)) {
  for (const r of m[1].matchAll(/"([^"]+)"/g)) {
    if (!terms.has(r[1])) missing++;
  }
}
assert.equal(missing, 0, `كل روابط related موجودة (كان ${missing})`);

console.log("content-audit-b049-andalus-ottoman-glossary-gate: ok");
