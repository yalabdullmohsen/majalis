/**
 * بوابة تدقيق محتوى الأقسام — تمنع رجوع فراغ/ضعف ظاهر في الكتالوجات الحية.
 * تشغيل: node --import tsx src/lib/__tests__/content-depth-audit-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const people = JSON.parse(read("public/data/quran-people/people.json"));
const list = people.people || [];
assert.ok(list.length >= 90, `الذين ذكروا في القرآن ≥90 (الآن ${list.length})`);
assert.ok(
  list.every((p: { slug?: string; nameAr?: string; definition?: string; status?: string; occurrences?: unknown[] }) =>
    Boolean(p.slug && p.nameAr && p.definition && Array.isArray(p.occurrences) && p.occurrences.length > 0),
  ),
  "كل علم له slug واسم وتعريف وموضع آية",
);
assert.ok(
  list.filter((p: { status?: string }) => p.status === "published").length >= 80,
  "≥80 مدخلًا منشورًا",
);
for (const required of ["adam", "ibrahim", "musa", "isa", "muhammad", "maryam", "firawn"]) {
  assert.ok(list.some((p: { slug?: string }) => p.slug === required), `مطلوب وجود: ${required}`);
}

const seerah = read("src/views/SeerahPage.tsx");
assert.doesNotMatch(seerah, /\ufde2/, "لا محارف PUA بدل رضي الله عنها في السيرة");
assert.match(seerah, /رضي الله عنها/, "صيغة الترضي صحيحة في السيرة");

const tarikh = read("src/lib/tarikh-islami-data.ts");
const tarikhLessons = (tarikh.match(/^\s+\[$/gm) || []).length;
assert.ok(
  tarikhLessons >= 20 || (tarikh.match(/title:/g) || []).length >= 5,
  "التاريخ الإسلامي فيه محاور/دروس كافية",
);
assert.doesNotMatch(tarikh, /قريبًا|TODO|FIXME/, "لا stubs ظاهرة في بيانات التاريخ");

const searchView = read("src/pages/account/ui/SearchView.tsx");
assert.match(searchView, /لا نتائج/, "رسالة واضحة عند فراغ البحث");
assert.match(searchView, /جرّب|تحقق|اختصر|كلمة أخرى/, "إرشاد عملي عند عدم وجود نتائج");

const normalize = read("src/shared/arabic-normalize.ts");
assert.match(normalize, /ة/g, "تطبيع التاء المربوطة");
assert.match(normalize, /[ىی]/, "تطبيع الألف المقصورة/الياء");

const registry = read("src/config/sections.registry.ts");
assert.doesNotMatch(registry, /subtitle:\s*""/, "لا عناوين فرعية فارغة في السجل");

console.log("content-depth-audit-gate.test.ts: ok");
