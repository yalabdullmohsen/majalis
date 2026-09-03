/**
 * بوابة b054: معرفة الأمم — محتوى فريد من nations-seed، بلا فقرات الذنب/المآل القالبية.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b054-nations-knowledge-gate.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const dir = resolve(root, "public/data/knowledge/nations");

const FORBIDDEN = [
  "ما نصّ عليه القرآن من تكذيب أو استكبار أو ظلم هو محل العبرة. وما سُكت عنه لا يُجزم به.",
  "إن ورد هلاك أو نجاة فمآلهم عبرة؛ والمقصود تعظيم التوحيد والحذر من الاستكبار.",
];

const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
assert.equal(files.length, 21, "21 ملف أمة (تغطية NATIONS)");

const malBlocks = new Set<string>();
const sinBlocks = new Set<string>();

for (const f of files) {
  const it = JSON.parse(readFileSync(resolve(dir, f), "utf8")) as {
    id: string;
    body: string;
    review_status?: string;
  };
  assert.ok(it.id?.startsWith("nation-"), `${f}: معرّف أمة`);
  assert.equal(it.review_status, "verified", `${it.id}: verified`);
  for (const ph of FORBIDDEN) {
    assert.equal(it.body.includes(ph), false, `${it.id}: بقايا حشو`);
  }
  assert.match(it.body, /## الذنب والموقف\n/, `${it.id}: قسم الذنب`);
  assert.match(it.body, /## المآل والعبرة\n/, `${it.id}: قسم المآل`);
  assert.match(it.body, /العبر:\n1\)/, `${it.id}: عبر مرقّمة`);
  const sin = (it.body.match(/## الذنب والموقف\n([\s\S]*?)(?=\n## |$)/) || [])[1]?.trim() || "";
  const mal = (it.body.match(/## المآل والعبرة\n([\s\S]*?)(?=\n## |$)/) || [])[1]?.trim() || "";
  assert.ok(sin.length > 80, `${it.id}: ذنب قصير`);
  assert.ok(mal.length > 80, `${it.id}: مآل قصير`);
  sinBlocks.add(sin);
  malBlocks.add(mal);
}

assert.equal(sinBlocks.size, 21, "ذنب/موقف فريد لكل أمة");
assert.equal(malBlocks.size, 21, "مآل/عبر فريد لكل أمة");

console.log("content-audit-b054-nations-knowledge-gate: ok");
