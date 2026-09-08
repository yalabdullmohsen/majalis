/**
 * بوابة: قصص بلا ذيل «تأمل في السياق» القالبي.
 * تشغيل: node --import tsx src/lib/__tests__/stories-reflection-filler-gate.test.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../public/data/stories");

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

console.log("\n=== قصص بلا ذيل تأمّل قالبي ===");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
assert(files.length > 0, "ملفات القصص موجودة");
for (const name of files) {
  const src = readFileSync(join(dir, name), "utf8");
  assert(!src.includes("تأمل في السياق"), `${name}: بلا «تأمل في السياق»`);
}

console.log(`\n=== النتيجة: ${passed} نجح / ${failed} فشل ===\n`);
if (failed > 0) process.exit(1);
