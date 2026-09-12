/**
 * بوابة: نمط مكارم الأخلاق مُعمَّم على الأقسام المناسبة.
 * تشغيل: node --import tsx src/lib/__tests__/section-makarim-pattern-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pattern = read("src/styles/section-makarim-pattern.css");
const main = read("src/main.tsx");
const amr = read("src/views/AmrBilMarufPage.tsx");
const akhlaq = read("src/styles/pages/akhlaq.css");

console.log("=== الملف مربوط في main ===");
assert.match(main, /section-makarim-pattern\.css/);

console.log("=== نمط مكارم يغطي الأقسام المناسبة ===");
for (const cls of [
  "mdb-card",
  "ai-card",
  "rq-card",
  "wn-card",
  "arkan-card",
  "sect-card",
  "hk-card",
  "as-alama-card",
  "tf-card",
  "amr-level",
]) {
  assert.match(pattern, new RegExp(`\\.${cls}`), `pattern يشمل .${cls}`);
}

assert.match(pattern, /\.rq-hero[\s\S]*?mj-brand-deep/, "رقائق: هيرو العلامة لا الأسود");
assert.match(pattern, /\.wn-hero[\s\S]*?mj-brand/, "وصايا: هيرو العلامة لا الذهبي");
assert.match(
  pattern,
  /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(var\(--card-min-width/,
  "شبكة متجاوبة بحد أدنى للبطاقة (بدل عمودين ثابتين)",
);
assert.match(pattern, /--radius-card,\s*24px/);
assert.doesNotMatch(pattern, /#7c3aed|#6D28D9/i, "لا بنفسجي");

console.log("=== أمر بالمعروف يستخدم هيكل مكارم ===");
assert.match(amr, /amr-page/);
assert.match(amr, /amr-levels/);
assert.match(amr, /amr-level/);
assert.match(amr, /amr-basis/);
assert.doesNotMatch(amr, /RANK_COLOR/);
assert.doesNotMatch(amr, /style=\{\{[\s\S]{0,40}borderRadius:\s*"0\.85rem"/);

console.log("=== مرجع مكارم ما زال قائمًا ===");
assert.match(akhlaq, /\.akl-card[\s\S]*?--radius-card/);
assert.match(akhlaq, /\.akl-cat[\s\S]*?min-height:\s*44px/);

console.log("section-makarim-pattern-gate.test.ts: ok");
