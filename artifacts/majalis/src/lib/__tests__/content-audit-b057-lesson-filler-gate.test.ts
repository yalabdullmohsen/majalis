/**
 * بوابة b057: لا جمل الحشو القالبي في بذور الدروس.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b057-lesson-filler-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const FILLERS = [
  "يُؤخذ للعمل بضابط الدليل، دون توسع فيما لم يثبت",
  "يُراجع بضابط الملخص المنقول، بلا زيادة حديث أو حكم غير مذكور فيه",
  "يُبدأ بحدّ العلم ونشأته قبل التطبيق حتى لا تُفهم المقاصد بمعزل عن الأدلة",
  "بيان موجز لموضوع",
];

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
  for (const phrase of FILLERS) {
    assert.equal(src.split(phrase).length - 1, 0, `${name}: بقايا «${phrase.slice(0, 24)}…»`);
  }
}

const script = readFileSync(resolve(root, "scripts/strip-lesson-filler.mjs"), "utf8");
assert.doesNotMatch(
  script,
  /const clean = `\$\{summary\} يُؤخذ للعمل بضابط الدليل/,
  "strip-lesson-filler لا يعيد حقن الحشو",
);

const iman = readFileSync(resolve(root, "src/lib/iman-topics-data.ts"), "utf8");
assert.match(iman, /أركان الإيمان الستة/, "قسم أركان الإيمان");
assert.match(iman, /التوحيد وأقسامه/, "قسم التوحيد");

console.log("content-audit-b057-lesson-filler-gate: ok");
