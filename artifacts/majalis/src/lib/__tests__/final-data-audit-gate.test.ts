/**
 * بوابة تدقيق البيانات النهائي — تمنع رجوع ادعاءات SEO/واجهة مضلّلة.
 * تشغيل: node --import tsx src/lib/__tests__/final-data-audit-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const monoArtifacts = join(root, ".."); // artifacts/

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(ent.name)) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|mjs|html|json)$/.test(ent.name)) out.push(p);
  }
  return out;
}

let badLink = 0;
for (const base of ["src", "scripts", "seo-prerender"]) {
  for (const file of walk(join(root, base))) {
    if (file.includes("final-data-audit") || file.includes("test-final-site-closure")) continue;
    const t = readFileSync(file, "utf8");
    if (t.includes("المصدر: رابط القراءة") || /المصدر:\s*<a[^>]*>\s*رابط القراءة\s*<\/a>/i.test(t)) {
      console.error("رابط القراءة:", file);
      badLink++;
    }
  }
}
assert.equal(badLink, 0, "ظهر «رابط القراءة» كمصدر");

const fiqh = readFileSync(join(root, "src/lib/fiqh-hub-topics.ts"), "utf8");
assert.equal(/موثّقة بالأدلة|موثقة بالأدلة/.test(fiqh), false, "fiqh hub يدعي موثّقة بالأدلة");
const rulings = readFileSync(join(root, "src/pages/fiqh/ui/RulingsView.tsx"), "utf8");
assert.equal(/موثقة بالأدلة|موثّقة بالأدلة/.test(rulings), false, "RulingsView يدعي موثّقة بالأدلة");

const meth = readFileSync(join(root, "src/views/MethodologyPage.tsx"), "utf8");
const seoBlock = meth.match(/applyPageSeo\(\{[\s\S]*?\}\);/);
assert.ok(seoBlock, "methodology applyPageSeo");
assert.equal(/قيد المراجعة الشرعية/.test(seoBlock![0]), false, "methodology meta حكم عام");

const people = JSON.parse(
  readFileSync(join(root, "public/data/quran-people/people.json"), "utf8"),
).people as Array<{
  slug: string;
  cautionNote?: string;
  occurrences?: Array<{ surah: number; ayah: number }>;
}>;
const azar = people.find((p) => p.slug === "azar");
assert.ok(azar, "آزر مفقود");
assert.ok(azar!.occurrences?.some((o) => o.surah === 6 && o.ayah === 74), "آزر بلا الأنعام 6:74");
const dk = people.find((p) => p.slug === "dhul-kifl");
assert.ok(dk?.cautionNote?.includes("وقع خلاف"), "ذو الكفل بلا احتراز خلاف النبوة");

const stories = readFileSync(join(root, "src/views/ProphetStoriesPage.tsx"), "utf8");
assert.equal(stories.includes("Esc للقائمة"), false, "Esc للقائمة ما زال ظاهراً");

const report = join(monoArtifacts, "content-audit/final-data-audit.md");
assert.ok(existsSync(report), `تقرير مفقود: ${report}`);

console.log("final-data-audit-gate.test.ts: ok");
