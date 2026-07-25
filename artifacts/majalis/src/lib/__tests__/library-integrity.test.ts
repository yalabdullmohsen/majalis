/**
 * اختبارات وحدة — سلامة فهرس المكتبة
 * يمنع رجوع الكتب المكررة (نفس المعرّف id، أو نفس العنوان بعد التطبيع تحت
 * معرّفين مختلفين مثل book-madarij / book-madaarij).
 *
 * تُشغَّل عبر: npx tsx src/lib/__tests__/library-integrity.test.ts
 */

import { LIBRARY_CATALOG } from "../library-catalog";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== لا معرّفات (id) مكررة ===");
const ids = LIBRARY_CATALOG.map((b) => b.id);
const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
assert(dupIds.length === 0, `لا معرّفات كتب مكررة${dupIds.length ? " — وُجد: " + dupIds.join(", ") : ""}`);

console.log("\n=== لا عنوانان متطابقان لنفس المؤلف بعد التطبيع ===");
function norm(a: string): string {
  return String(a || "")
    .replace(/[ً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[«»"'.،,\-—:()]/g, "")
    .replace(/^ال/, "")
    .replace(/\s+/g, "")
    .trim();
}
// نجمع حسب (العنوان المُطبّع + المؤلف المُطبّع) لتفادي دمج كتب مختلفة لمؤلفين مختلفين
const groups = new Map<string, string[]>();
for (const b of LIBRARY_CATALOG) {
  const k = `${norm(b.title)}::${norm(b.author)}`;
  const list = groups.get(k) ?? [];
  list.push(b.id);
  groups.set(k, list);
}
const dupTitles = [...groups.entries()].filter(([, v]) => v.length > 1);
assert(
  dupTitles.length === 0,
  `لا كتب مكررة لنفس المؤلف${dupTitles.length ? " — وُجد: " + dupTitles.map(([k, v]) => `${k} → [${v.join(", ")}]`).join(" | ") : ""}`,
);

console.log("\n=== لا معرّفات دُمجت سابقًا عادت للظهور ===");
const MERGED_AWAY = [
  "book-madaarij", "book-saadi", "book-tafsir-al-saadi", "book-tabari-tafsir",
  "book-baghawi-tafsir", "book-ajrumiyyah", "book-alfiyya", "book-al-mustasfa-ghazali",
  "book-bulugh", "book-al-minhaj-nawawi", "book-muqaddimah",
];
const idSet = new Set(ids);
const returned = MERGED_AWAY.filter((id) => idSet.has(id));
assert(returned.length === 0, `لا كتب مدموجة عادت${returned.length ? " — عادت: " + returned.join(", ") : ""}`);

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
