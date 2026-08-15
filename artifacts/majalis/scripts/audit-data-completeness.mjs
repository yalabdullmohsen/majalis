#!/usr/bin/env node
/**
 * اكتمال البيانات الحرج: آزر، cautionNote، مصادر المكتبة، فقه، methodology.
 * تشغيل: node scripts/audit-data-completeness.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const people = JSON.parse(read("public/data/quran-people/people.json"));
const list = people.people || [];
assert.ok(list.some((p) => p.slug === "azar" && p.nameAr === "آزر"), "آزر موجود");
const dhul = list.find((p) => p.slug === "dhul-kifl");
assert.ok(dhul?.cautionNote && dhul.cautionNote.length > 20, "ذو الكفل cautionNote");
for (const slug of ["harut", "marut"]) {
  const p = list.find((x) => x.slug === slug);
  assert.ok(p, slug);
  assert.ok(!/إسرائيليات محظورة|تفاصيل إسرائيلية موسّعة/i.test(JSON.stringify(p)));
  assert.ok(
    p.occurrences?.some((o) => o.surah === 2 && o.ayah === 102),
    `${slug} مربوط بالبقرة 102`,
  );
}

const lib = read("src/lib/library-catalog.ts");
assert.match(lib, /sourceStatus/);
assert.match(lib, /sourceReference/);
assert.doesNotMatch(lib, /المصدر:.*رابط القراءة/);

const detail = read("src/pages/library/ui/LibraryDetailView.tsx");
assert.match(detail, /المصدر قيد الإضافة|library-source-pending/);
assert.doesNotMatch(detail, />قراءة المصدر</);

const fiqh = read("src/lib/fiqh-hub-topics.ts");
assert.doesNotMatch(fiqh, /موثّقة بالأدلة/);
assert.match(fiqh, /يجري ربطها بالأدلة|ربط تدريجي/);

const rulings = read("src/pages/fiqh/ui/RulingsView.tsx");
assert.doesNotMatch(rulings, /موثقة بالأدلة والمراجع/);

const method = read("src/views/MethodologyPage.tsx");
assert.match(method, /منهجية التوثيق المعتمدة|لا يعني أن المنهج كله غير معتمد/);
// لا يجوز أن يكون الوصف العام للصفحة مجرد «قيد المراجعة» بلا توضيح أنه يخص مواداً
assert.match(method, / يخص مواداً|على تلك المادة|استيراد آلي/);

const gen = read("scripts/generate-seo.mjs");
assert.doesNotMatch(gen, /المصدر: <a[^>]*>رابط القراءة<\/a>/);
assert.match(gen, /NATIONS/);
assert.match(gen, /QURAN_PEOPLE/);

const seo = read("src/lib/seo-routes.json");
assert.match(seo, /"path": "\/nations"/);
assert.match(seo, /"path": "\/quran\/people"/);

assert.ok(existsSync(join(root, "seo-prerender/nations/index.html")), "prerender nations");
assert.ok(existsSync(join(root, "seo-prerender/quran/people/azar/index.html")), "prerender azar");

console.log("✓ audit:data-completeness ok");
