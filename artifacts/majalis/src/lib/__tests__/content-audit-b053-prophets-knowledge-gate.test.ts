/**
 * بوابة b053: معرفة الأنبياء — دروس فريدة لكل نبي، بلا حشو «يُراجع مقالة الأمة».
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b053-prophets-knowledge-gate.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const dir = resolve(root, "public/data/knowledge/prophets");

const FORBIDDEN = ["يُراجع مقالة الأمة المرتبطة عبر حقل related إن وُجدت"];

const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
assert.equal(files.length, 25, "25 ملف نبي");

const lessonBlocks = new Set<string>();
const genericLessons =
  "1) تعظيم التوحيد ونبذ الشرك.\n2) الصبر على الأذى في سبيل الحق.\n3) أن القرابة لا تغني عن الإيمان.";

for (const f of files) {
  const it = JSON.parse(readFileSync(resolve(dir, f), "utf8")) as {
    id: string;
    body: string;
    review_status?: string;
  };
  assert.ok(it.id?.startsWith("prophet-"), `${f}: معرّف نبي`);
  for (const ph of FORBIDDEN) {
    assert.equal(it.body.includes(ph), false, `${it.id}: بقايا حشو`);
  }
  assert.match(it.body, /## الدروس والعبر\n/, `${it.id}: قسم دروس`);
  const lessons = (it.body.match(/## الدروس والعبر\n([\s\S]*?)(?=\n## |$)/) || [])[1]?.trim() || "";
  assert.ok(lessons.length > 40, `${it.id}: دروس فارغة`);
  assert.ok(!lessons.startsWith(genericLessons), `${it.id}: دروس عامة قديمة`);
  lessonBlocks.add(lessons);
  assert.match(it.body, /## أبرز المواقف والابتلاءات\n- /, `${it.id}: مواقف منقّطة`);
}

assert.equal(lessonBlocks.size, 25, "دروس فريدة لكل نبي");

console.log("content-audit-b053-prophets-knowledge-gate: ok");
