/**
 * اختبار انحدار (regression) لمنع تكرار العلماء/المشايخ.
 *
 * يتحقق من أن قائمة العلماء في المصدر (sheikhs-seed.ts) لا تحتوي على
 * معرّفات (id) مكررة ولا أسماء مكررة — وهو السبب الجذري الذي كان يُظهر
 * الشيخ نفسه مرتين في القوائم ونتائج البحث.
 *
 * التشغيل: node scripts/test-sheikhs-dedup.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = join(__dirname, "../src/lib/sheikhs-seed.ts");
const source = readFileSync(seedPath, "utf8");

const ids = [...source.matchAll(/\bid:\s*"([^"]+)"/g)].map((m) => m[1]);
const names = [...source.matchAll(/\bname:\s*"([^"]+)"/g)].map((m) => m[1]);

function duplicates(list) {
  const seen = new Set();
  const dups = new Set();
  for (const item of list) {
    if (seen.has(item)) dups.add(item);
    seen.add(item);
  }
  return [...dups];
}

const dupIds = duplicates(ids);
const dupNames = duplicates(names);

let failed = false;
if (dupIds.length) {
  failed = true;
  console.error(`❌ معرّفات مكررة (${dupIds.length}): ${dupIds.join(", ")}`);
}
if (dupNames.length) {
  failed = true;
  console.error(`❌ أسماء مكررة (${dupNames.length}): ${dupNames.join(", ")}`);
}

if (failed) process.exit(1);
console.log(`✅ لا تكرار: ${ids.length} عالِمًا بمعرّفات وأسماء فريدة.`);
