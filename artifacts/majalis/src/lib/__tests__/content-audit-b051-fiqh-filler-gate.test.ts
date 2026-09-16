/**
 * بوابة b051: بذرة مسائل المجمع حُذفت من الإنتاج؛ لا حشو قالبي في الأرشيف.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b051-fiqh-filler-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

assert.equal(
  existsSync(resolve(root, "src/lib/fiqh-issues-seed.ts")),
  false,
  "fiqh-issues-seed.ts يجب أن يُحذف من الإنتاج",
);
assert.equal(
  existsSync(resolve(root, "src/views/FiqhCouncilPage.tsx")),
  false,
  "FiqhCouncilPage يجب أن تُحذف",
);

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
  assert.equal(generated.split(ph).length - 1, 0, `rulings generated: بقايا «${ph}»`);
}

console.log("content-audit-b051-fiqh-filler-gate: ok (council seed removed)");
