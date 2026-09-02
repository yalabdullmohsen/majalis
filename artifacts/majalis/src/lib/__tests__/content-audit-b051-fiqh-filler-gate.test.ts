/**
 * بوابة b051: لا حشو قالبي في بذرة المسائل الفقهية كلها (لا الظاهرة فقط).
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b051-fiqh-filler-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const seed = readFileSync(resolve(root, "src/lib/fiqh-issues-seed.ts"), "utf8");
const generated = readFileSync(
  resolve(root, "content/archive/rulings-encyclopedia/seeds/rulings-encyclopedia-seed.generated.ts"),
  "utf8",
);

const FORBIDDEN = [
  "دون اختزال مخلّ",
  "ويُضبط النقل بضوابط أهل العلم بلا غلو ولا تهاون",
  "والمقصود تقريب الفهم للمسلم المعاصر مع الرجوع للدليل",
  "محل النزاع قبل الترجيح",
  "الحكم الكلي وتنزيله على الواقعة",
  "العمدة فيها الدليل والمصلحة الشرعية المنضبطة",
  "وتُعرض للعامة بأسلوب ميسّر دون إغفال الدليل",
];

for (const ph of FORBIDDEN) {
  assert.equal(seed.split(ph).length - 1, 0, `fiqh-issues-seed: بقايا «${ph}»`);
  assert.equal(generated.split(ph).length - 1, 0, `rulings generated: بقايا «${ph}»`);
}

// sanity: crypto ruling still has substance
assert.match(seed, /العملات الرقمية/, "مسألة العملات موجودة");
assert.match(seed, /غرر/, "مضمون غرر في العملات");
assert.match(seed, /التبرع بالأعضاء/, "مسألة التبرع موجودة");

console.log("content-audit-b051-fiqh-filler-gate: ok");
