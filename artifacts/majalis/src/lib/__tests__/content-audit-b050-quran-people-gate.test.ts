/**
 * بوابة b050: الذين ذُكروا في القرآن — لا «الزانية» بدل الزبانية، ولا حكمة مكررة آليًا.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b050-quran-people-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const listPath = resolve(root, "public/data/quran-people/people.json");
const knowledgePath = resolve(root, "public/data/knowledge/quran-people/people.json");

const list = JSON.parse(readFileSync(listPath, "utf8"));
const knowledge = JSON.parse(readFileSync(knowledgePath, "utf8"));

const zabaniya = list.people.find((p: { slug: string }) => p.slug === "zabaniya");
assert.ok(zabaniya, "zabaniya موجود");
assert.match(zabaniya.definition, /الزبانية/, "تعريف الزبانية");
assert.doesNotMatch(zabaniya.definition, /الزانية/, "لا تصحيف الزانية");
assert.ok(
  Array.isArray(zabaniya.lessons) && zabaniya.lessons.length >= 2,
  "دروس الزبانية",
);
assert.ok(
  !zabaniya.lessons.some((l: string) => /وليسأل القارئ/.test(l)),
  "لا درس حشو عام للزبانية",
);

const wisdom =
  "والحكمة الجامعة من ذكر الأعلام والأماكن والأقوام في القرآن هي العبرة والتوحيد، لا الاستكثار من الغرائب.";
let dupWisdom = 0;
for (const it of knowledge.items as { body?: string }[]) {
  const body = it.body || "";
  if (body.split(wisdom).length - 1 >= 2) dupWisdom++;
  assert.doesNotMatch(body, /الزانية خزنة|الزانية ملائكة/, "لا تصحيف في المعرفة");
}
assert.equal(dupWisdom, 0, "لا تكرار لفقرة الحكمة الجامعة");

const genericLessons = (list.people as { lessons?: string[] }[]).filter((p) =>
  (p.lessons || []).some((l) => /ليسأل القارئ|تُقرأ على النفس قبل الغير/.test(l)),
).length;
assert.equal(genericLessons, 0, "أُزيل حشو الدروس الآلي من دروس القائمة");

console.log("content-audit-b050-quran-people-gate: ok");
