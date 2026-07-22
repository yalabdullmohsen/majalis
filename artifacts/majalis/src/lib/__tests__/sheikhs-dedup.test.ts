/**
 * اختبارات وحدة — سلامة بيانات المشايخ
 * يمنع رجوع السجلات المكررة في sheikhs-seed.ts (نفس المعرّف id مرتين، أو نفس
 * الاسم بعد التطبيع) لأنها تُعرض مرتين عبر getSheikhs()/البحث فتكسر وعد
 * «لا يوجد أكثر من سجل للعالِم نفسه».
 *
 * تُشغَّل عبر: npx tsx src/lib/__tests__/sheikhs-dedup.test.ts
 */

import { SHEIKHS_SEED, dedupeSheikhs } from "../sheikhs-seed";

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

console.log("\n=== لا معرّفات (id) مكررة في مصدر المشايخ ===");
const ids = SHEIKHS_SEED.map((s) => s.id);
const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
assert(dupIds.length === 0, `لا معرّفات مكررة${dupIds.length ? " — وُجد: " + dupIds.join(", ") : ""}`);

console.log("\n=== لا اسمان متطابقان بعد التطبيع ===");
function norm(a: string): string {
  return a
    .replace(/[ً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/(الإمام|الشيخ|الحافظ|الدكتور|العلامة)\s*/g, "")
    .replace(/\s+/g, "")
    .trim();
}
const nameGroups = new Map<string, string[]>();
for (const s of SHEIKHS_SEED) {
  const k = norm(s.name);
  const list = nameGroups.get(k) ?? [];
  list.push(s.id);
  nameGroups.set(k, list);
}
const dupNames = [...nameGroups.entries()].filter(([, v]) => v.length > 1);
assert(
  dupNames.length === 0,
  `لا أسماء مكررة${dupNames.length ? " — وُجد: " + dupNames.map(([k, v]) => `${k} → [${v.join(", ")}]`).join(" | ") : ""}`,
);

console.log("\n=== الحارس الدفاعي dedupeSheikhs يعمل ===");
const withDup = [...SHEIKHS_SEED, { ...SHEIKHS_SEED[0] }];
const deduped = dedupeSheikhs(withDup);
assert(deduped.length === SHEIKHS_SEED.length, `dedupeSheikhs يُزيل السجل المكرر (${withDup.length} → ${deduped.length})`);

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
