/**
 * اختبارات وحدة — سلامة بيانات العلماء
 * يمنع رجوع 16 سجلاً مكررًا حُذفت (نفس الشخص التاريخي بمعرّف id مختلف، مثل
 * ibn-kathir/ibn-kathir-2/ibn-kathir-imam) لأن هذا يكسر وعد "لا يوجد أكثر من
 * سجل للشخص نفسه" في سياسة المحتوى.
 *
 * تُشغَّل عبر: npx tsx src/lib/__tests__/scholars-data-integrity.test.ts
 */

import { SCHOLARS } from "../scholars-data";

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

const ids = SCHOLARS.map((s) => s.id);
const uniqueIds = new Set(ids);
assert(ids.length === uniqueIds.size, `عدد المعرّفات (${ids.length}) يطابق عدد الفريد منها (${uniqueIds.size})`);

console.log("\n=== لا شخص واحد مسجَّل مرتين (نفس fullName + نفس died) ===");

const identityKey = (s: (typeof SCHOLARS)[number]) => `${s.fullName}::${s.died}`;
const seen = new Map<string, string[]>();
for (const s of SCHOLARS) {
  const key = identityKey(s);
  const list = seen.get(key) ?? [];
  list.push(s.id);
  seen.set(key, list);
}
const duplicateIdentities = [...seen.entries()].filter(([, list]) => list.length > 1);
assert(
  duplicateIdentities.length === 0,
  `لا يوجد شخص مسجَّل بمعرّفين مختلفين${
    duplicateIdentities.length ? " — وُجد: " + duplicateIdentities.map(([k, v]) => `${k} → [${v.join(", ")}]`).join(" | ") : ""
  }`
);

console.log("\n=== لا اسمان متطابقان بعد التطبيع (نفس العالِم باسمين) ===");

// تطبيع عربي: حذف التشكيل، توحيد الألف والتاء المربوطة والياء، حذف الألقاب و«ال» التعريف
function normalizeArabicName(a: string): string {
  return a
    .replace(/[ً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/(الإمام|الشيخ|الحافظ|الشيخة)\s*/g, "")
    .replace(/^ال/, "")
    .replace(/\s+/g, "")
    .trim();
}
const nameGroups = new Map<string, string[]>();
for (const s of SCHOLARS) {
  const key = normalizeArabicName(s.name);
  const list = nameGroups.get(key) ?? [];
  list.push(s.id);
  nameGroups.set(key, list);
}
const duplicateNames = [...nameGroups.entries()].filter(([, list]) => list.length > 1);
assert(
  duplicateNames.length === 0,
  `لا يوجد عالِم مسجَّل باسمين متطابقين بعد التطبيع${
    duplicateNames.length ? " — وُجد: " + duplicateNames.map(([k, v]) => `${k} → [${v.join(", ")}]`).join(" | ") : ""
  }`
);

console.log("\n=== لا معرّف (slug) يشير إلى عالِم آخر (منع رجوع الأخطاء المعروفة) ===");

// أزواج (اسم → معرّف صحيح) أُصلحت سابقًا؛ يمنع رجوع slug خاطئ يشير لعالِم مختلف
const CORRECT_SLUGS: Record<string, string> = {
  "السخاوي": "al-sakhawi",
  "الشيخ ابن جبرين": "ibn-jibreen",
  "الشيخ عبد الكريم الخضير": "abdulkarim-alkhudair",
  "ابن عطاء الله السكندري": "ibn-ata-allah",
};
// معرّفات كانت خاطئة يجب ألا تعود (تشير لغير صاحبها)
const FORBIDDEN_SLUGS = new Set([
  "ibn-al-qayyim-alt",
  "ibn-uthaymin-ext",
  "ibn-uthaymeen-older",
  "al-ghazali-junior",
]);
for (const [name, expectedId] of Object.entries(CORRECT_SLUGS)) {
  const rec = SCHOLARS.find((s) => s.name === name);
  assert(!!rec && rec.id === expectedId, `«${name}» معرّفه الصحيح «${expectedId}» (الموجود: ${rec ? rec.id : "غير موجود"})`);
}
const forbiddenPresent = SCHOLARS.filter((s) => FORBIDDEN_SLUGS.has(s.id)).map((s) => s.id);
assert(forbiddenPresent.length === 0, `لا معرّفات خاطئة معروفة${forbiddenPresent.length ? " — عادت: " + forbiddenPresent.join(", ") : ""}`);

console.log("\n=== كل حقل died غير فارغ ===");

const missingDied = SCHOLARS.filter((s) => !s.died || s.died.trim() === "");
assert(missingDied.length === 0, `كل السجلات (${SCHOLARS.length}) لديها تاريخ وفاة`);

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
