#!/usr/bin/env node
/**
 * حارس ميزانية JS المسار الحرج — يمنع إعادة سحب بذور الشريط/الكتالوج إلى index.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distJs = resolve(appRoot, "dist/assets");

let indexJs = null;
try {
  for (const name of readdirSync(distJs)) {
    if (/^index-.*\.js$/.test(name)) {
      const p = join(distJs, name);
      const sz = statSync(p).size;
      if (!indexJs || sz > indexJs.size) indexJs = { name, size: sz, path: p };
    }
  }
} catch {
  console.log("· لا dist بعد — تخطي فحص حجم JS المُبنى.");
  process.exit(0);
}

if (!indexJs) {
  console.error("✗ لم يُعثر على dist/assets/index-*.js");
  process.exit(1);
}

const src = readFileSync(indexJs.path, "utf8");
const leaks = [];
if (/adh-morning/.test(src)) leaks.push("adhkar-seed (adh-morning)");
if (/seed-fawaid|SEED_FAWAID/.test(src)) leaks.push("fawaid-seed");
if (/ARBAEEN_NAWAWI|nawawi-\d+/.test(src) && /الأربعون النووية/.test(src)) {
  leaks.push("arbaeen-nawawi-seed");
}

// كان ~978KB قبل تأجيل الشريط؛ السقف يمنع الانتكاس دون منع نمو معتدل.
const BUDGET = 450_000;
if (indexJs.size > BUDGET) {
  console.error(`✗ JS الحرج ${indexJs.name} = ${indexJs.size} بايت > الميزانية ${BUDGET}.`);
  process.exit(1);
}
if (leaks.length) {
  console.error("✗ تسرّب بذور ثقيلة إلى index:\n  - " + leaks.join("\n  - "));
  process.exit(1);
}

console.log(
  `✓ JS الحرج ${indexJs.name} = ${indexJs.size} بايت (≤ ${BUDGET}) بلا بذور الشريط الثقيلة.`,
);
