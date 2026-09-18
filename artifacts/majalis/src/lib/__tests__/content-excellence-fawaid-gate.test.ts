/**
 * بوابة Content Excellence — عناقيد قوالب الفوائد.
 * تُشغَّل: npx tsx src/lib/__tests__/content-excellence-fawaid-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stripFawaidBoilerplate } from "../fawaid-text";
import { isQualityFawaid } from "../content-quality";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const seed = readFileSync(resolve(root, "src/lib/fawaid-curated-seed.ts"), "utf8");

console.log("=== no template disclaimer tails in curated seed ===");
{
  assert.doesNotMatch(seed, /وهذه فائدة تذكيرية موجزة/);
  assert.doesNotMatch(seed, /وهذه فائدة تربوية محررة/);
  assert.doesNotMatch(seed, /وهي فائدة تذكيرية موثقة/);
  assert.doesNotMatch(seed, /وهي فائدة محررة للتذكير/);
  assert.doesNotMatch(seed, /وتفهم هذه العبارة في ضوء الوحي/);
  assert.doesNotMatch(seed, /يربي طالب العلم على ضبط باب/);
  assert.doesNotMatch(seed, /من مفاتيح ضبط باب/);
  assert.doesNotMatch(seed, /يعين على ضبط باب/);
}

console.log("=== stripFawaidBoilerplate removes excellence tails ===");
{
  const sample =
    "التوحيد أصل الدين. وهذه فائدة تذكيرية موجزة، تفهم في ضوء النصوص وكلام أهل العلم، ولا تحول إلى حكم مطلق على كل واقعة.";
  const cleaned = stripFawaidBoilerplate(sample);
  assert.equal(cleaned, "التوحيد أصل الدين.");
  assert.doesNotMatch(cleaned, /فائدة تذكيرية/);
}

console.log("=== quality filter hides bab×topic permutations ===");
{
  assert.equal(
    isQualityFawaid({
      text: "الإخلاص يربي طالب العلم على ضبط باب الفقه: تنقية القصد.",
      author_name: "أهل العلم",
      source: "البينة: 5",
    }),
    false,
  );
  assert.equal(
    isQualityFawaid({
      text: "الإخلاص: تنقية القصد من طلب مدح الناس وجعل العمل لله وحده.",
      author_name: "أهل العلم",
      source: "البينة: 5",
    }),
    true,
  );
}

console.log("content-excellence-fawaid-gate: ok");
