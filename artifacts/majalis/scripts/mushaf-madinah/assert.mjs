#!/usr/bin/env node
/**
 * يجمع قياسات الـshards ويؤكد الحد الأدنى لبوابات المصحف الجديد.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const dir = process.env.MUSHAF_SINGLE_PASS_IN_DIR || resolve("artifacts/mushaf-single-pass");
const outFile = process.env.MUSHAF_SINGLE_PASS_OUT;
const files = outFile
  ? [outFile]
  : readdirSync(dir).filter((f) => /^measurements(-local|-shard-\d+)?\.json$/.test(f));
if (!files.length) {
  console.error("لا ملفات قياسات في", dir);
  process.exit(1);
}

const all = [];
for (const f of files) {
  const p = f.startsWith("/") || f.includes("artifacts/") ? resolve(f) : resolve(dir, f);
  const raw = JSON.parse(readFileSync(p, "utf8"));
  all.push(...(raw.measurements || []));
}

if (!all.length) {
  console.error("قياسات فارغة");
  process.exit(1);
}

const bad = all.filter((m) => {
  const pageNo = Number(m.page ?? m.pageAttr);
  const slotsOk = pageNo <= 2 ? m.slots > 0 && m.slots <= 15 : m.slots === 15;
  const paintFail =
    "fontCheck" in m &&
    (m.fontCheck === false ||
      !(m.fontSize >= 12 && m.fontSize <= 35) ||
      m.pageOverflow ||
      m.lineOverflow ||
      m.overlap);
  return !m.ok || !slotsOk || m.hasPdf || !/qpc-v2-p/i.test(m.fontFamily || "") || paintFail;
});
if (bad.length) {
  console.error("فشل assert:", bad.slice(0, 8));
  process.exit(1);
}

console.log(`✓ mushaf assert: ${all.length} صفحة، شبكة ١٥، بلا PDF، خط QPC`);
