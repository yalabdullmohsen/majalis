#!/usr/bin/env node
/**
 * يجمع قياسات الـshards ويؤكد الحد الأدنى لبوابات المصحف الجديد.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const dir = process.env.MUSHAF_SINGLE_PASS_IN_DIR || resolve("artifacts/mushaf-single-pass");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
if (!files.length) {
  console.error("لا ملفات قياسات في", dir);
  process.exit(1);
}

const all = [];
for (const f of files) {
  const raw = JSON.parse(readFileSync(resolve(dir, f), "utf8"));
  all.push(...(raw.measurements || []));
}

if (!all.length) {
  console.error("قياسات فارغة");
  process.exit(1);
}

const bad = all.filter((m) => !m.ok || m.slots !== 15 || m.hasPdf || !/qpc-v2-p/i.test(m.fontFamily || ""));
if (bad.length) {
  console.error("فشل assert:", bad.slice(0, 8));
  process.exit(1);
}

console.log(`✓ mushaf assert: ${all.length} صفحة، شبكة ١٥، بلا PDF، خط QPC`);
