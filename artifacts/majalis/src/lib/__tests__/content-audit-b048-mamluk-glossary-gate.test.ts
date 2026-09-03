/**
 * بوابة b048: مماليك/سلاجقة + تنظيف روابط المصطلحات وإضافة مصطلحات أساسية.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b048-mamluk-glossary-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const mamluk = readFileSync(resolve(root, "src/data/islamic-history/mamluk.json"), "utf8");
const seljuk = readFileSync(resolve(root, "src/data/islamic-history/seljuk-ayyubid.json"), "utf8");
const glossary = readFileSync(
  resolve(root, "src/pages/account/ui/IslamicGlossaryView.tsx"),
  "utf8",
);

assert.doesNotMatch(mamluk, /قوتز|كيتبوقا|صبح الأعشا|بدائع الذهوب|راعدان|تهدٍ|العصر الوسط/, "لا بقايا تشويه مماليك");
assert.match(mamluk, /قطز/, "اسم السلطان قطز");
assert.match(mamluk, /كتبغا/, "قائد المغول كتبغا");
assert.match(mamluk, /الريدانية/, "معركة الريدانية");
assert.match(mamluk, /صبح الأعشى/, "صبح الأعشى");
assert.match(mamluk, /بدائع الزهور/, "بدائع الزهور");

assert.doesNotMatch(seljuk, /طغرل بن ألب أرسلان|الروض الباسم/, "لا خلط طغرل/ألب أرسلان ولا مصدر وهمي");
assert.match(seljuk, /طغرل بك/, "طغرل بك");
assert.match(seljuk, /ألب أرسلان/, "ألب أرسلان منفصل");
assert.match(seljuk, /النوادر السلطانية/, "مصدر نوادر سلطانية");

for (const term of [
  "العبادة",
  "السنة",
  "الصلاة",
  "الطهارة",
  "الدعاء",
  "الاستغفار",
  "الصدق",
  "أصول الفقه",
  "علوم القرآن",
  "المدينة المنورة",
  "الوحي",
  "أصول التفسير",
  "المنقطع",
  "النفاق",
]) {
  assert.match(glossary, new RegExp(`term: "${term}"`), `مصطلح ${term}`);
}

assert.match(glossary, /related: \["السنة", "المصلحة المرسلة", "الاجتهاد"\]/, "بدعة ↔ مصلحة مرسلة");
assert.match(glossary, /term: "مقاصد الشريعة"[\s\S]*?related: \["الاجتهاد", "المصلحة المرسلة"/, "مقاصد ↔ مصلحة مرسلة");
assert.match(glossary, /term: "القياس"[\s\S]{0,500}?related: \["أصول الفقه", "المصلحة المرسلة"\]/, "القياس ↔ مصلحة مرسلة");

// related must mostly resolve
const terms = new Set([...glossary.matchAll(/term:\s*"([^"]+)"/g)].map((m) => m[1]));
let missing = 0;
for (const m of glossary.matchAll(/related:\s*\[([^\]]*)\]/g)) {
  for (const r of m[1].matchAll(/"([^"]+)"/g)) {
    if (!terms.has(r[1])) missing++;
  }
}
assert.ok(missing <= 40, `روابط related المكسورة ≤40 (الآن ${missing})`);

console.log("content-audit-b048-mamluk-glossary-gate: ok");
