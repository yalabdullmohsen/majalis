#!/usr/bin/env node
/** تشغيل كل بوابات المحتوى بالترتيب. */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const gates = [
  "test-content-schema.mjs",
  "test-content-ayah.mjs",
  "test-content-hadith.mjs",
  "test-content-dupes.mjs",
  "test-content-links.mjs",
  "test-content-quality.mjs",
  "test-content-lang.mjs",
];

let failed = 0;
for (const g of gates) {
  const r = spawnSync(process.execPath, [path.join(dir, g)], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}
if (failed) {
  console.error(`\n✗ test:content-gates — فشل ${failed}/${gates.length}`);
  process.exit(1);
}
console.log(`\n✓ test:content-gates — نجحت ${gates.length}/${gates.length}`);
