/**
 * بوابة: روابط المستجدات لا تعيد توجيه المحتوى إلى مسارات خاطئة الدلالة.
 * تشغيل: node --import tsx src/lib/__tests__/updates-seed-hrefs-gate.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const src = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../updates-seed.ts"), "utf8");

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

console.log("\n=== روابط updates-seed ===");
assert(!/id:\s*"update-news-conference"/.test(src), "لا خبر مؤتمر غير موثّق");
assert(!/source_url:\s*"\/sources"/.test(src), "لا توجيه كتب إلى /sources");
assert(!/id:\s*"update-sheikhs-[^"]+"[\s\S]{0,280}source_url:\s*"\/tarikh-islami"/.test(src), "تحديثات العلماء لا تشير إلى التاريخ");
assert(!/id:\s*"update-lesson-tafsir"[\s\S]{0,220}source_url:\s*"\/lessons"\s*,/.test(src), "درس النحل له مسار عميق");
assert(/id:\s*"update-course-ijazah"[\s\S]{0,280}source_url:\s*"\/annual-courses\/course-ijazah-tahrir-2026"/.test(src), "دورة الإجازة بمسار عميق");

console.log(`\n=== النتيجة: ${passed} نجح / ${failed} فشل ===\n`);
if (failed > 0) process.exit(1);
