/**
 * بوابة b057: لا جملة الحشو «يُؤخذ للعمل بضابط الدليل…» في بذور الدروس.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b057-lesson-filler-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const FILLER = "يُؤخذ للعمل بضابط الدليل، دون توسع فيما لم يثبت";

const TARGETS = [
  "usra-mujtama-data.ts",
  "tazkiya-topics-data.ts",
  "iman-topics-data.ts",
  "fikr-waqia-data.ts",
  "mawsuaat-data.ts",
  "durus-mutanawwia-data.ts",
  "durus-imaniyya-data.ts",
  "maqasid-sharia-data.ts",
  "sunnah-studies-data.ts",
  "arabic-language-data.ts",
  "dalail-nubuwwah-data.ts",
];

for (const name of TARGETS) {
  const fp = resolve(root, "src/lib", name);
  assert.ok(existsSync(fp), `موجود: ${name}`);
  const src = readFileSync(fp, "utf8");
  assert.equal(src.split(FILLER).length - 1, 0, `${name}: بقايا الحشو`);
}

// السكربت نفسه لا يعيد حقن الحشو
const script = readFileSync(resolve(root, "scripts/strip-lesson-filler.mjs"), "utf8");
assert.doesNotMatch(
  script,
  /const clean = `\$\{summary\} يُؤخذ للعمل بضابط الدليل/,
  "strip-lesson-filler لا يعيد حقن الحشو",
);

// sanity: عناوين دروس باقية
const iman = readFileSync(resolve(root, "src/lib/iman-topics-data.ts"), "utf8");
assert.match(iman, /أركان الإيمان الستة/, "قسم أركان الإيمان");
assert.match(iman, /التوحيد وأقسامه/, "قسم التوحيد");

console.log("content-audit-b057-lesson-filler-gate: ok");
