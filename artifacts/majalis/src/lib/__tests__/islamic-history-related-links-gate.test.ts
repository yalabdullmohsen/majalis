/**
 * بوابة: روابط relatedLinks في التاريخ بلا تكرار حرفي لنفس href.
 * تشغيل: node --import tsx src/lib/__tests__/islamic-history-related-links-gate.test.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = resolve(dirname(fileURLToPath(import.meta.url)), "../../data/islamic-history");

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

console.log("\n=== relatedLinks بلا تكرار ===");
for (const name of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const data = JSON.parse(readFileSync(join(dir, name), "utf8")) as Array<{
    id?: string;
    relatedLinks?: Array<{ href?: string } | string>;
  }>;
  for (const it of data) {
    const links = it.relatedLinks ?? [];
    const hrefs = links.map((x) => (typeof x === "string" ? x : x.href ?? JSON.stringify(x)));
    assert(new Set(hrefs).size === hrefs.length, `${name}:${it.id ?? "?"} بلا href مكرر`);
  }
}

console.log(`\n=== النتيجة: ${passed} نجح / ${failed} فشل ===\n`);
if (failed > 0) process.exit(1);
