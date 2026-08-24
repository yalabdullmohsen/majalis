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

const newMuslim = read("src/views/NewMuslimPathPage.tsx");
assert.doesNotMatch(newMuslim, /قيد الإعداد/, "مسار المسلم الجديد لا يعرض «قيد الإعداد»");
assert.match(newMuslim, /جاري تحميل/, "مسار المسلم الجديد يعرض حالة تحميل");

const normalize = read("src/shared/arabic-normalize.ts");
assert.match(normalize, /ة/g, "تطبيع التاء المربوطة");
assert.match(normalize, /[ىی]/, "تطبيع الألف المقصورة/الياء");

const registry = read("src/config/sections.registry.ts");
assert.doesNotMatch(registry, /subtitle:\s*""/, "لا عناوين فرعية فارغة في السجل");

assert.ok(
  list.every((p: { definition?: string }) => (p.definition || "").trim().length >= 100),
  "كل تعريف علم ≥100 حرفًا",
);

const quizSeed = read("src/lib/quiz-seed.ts");
assert.match(quizSeed, /isLiveQuizQuestion|demo\[-_\]/, "تصفية أسئلة demo من العرض الحي");

const kgService = read("src/lib/knowledge-graph-service.ts");
assert.match(kgService, /fetchStaticKnGraphFallback/, "احتياطي محلي للرسم المعرفي");

const kgPage = read("src/views/KnowledgeGraphPage.tsx");
assert.match(kgPage, /fetchStaticKnGraphFallback/, "الصفحة تستخدم الاحتياطي المحلي");
assert.match(kgPage, /\/prophets|\/fiqh|\/quran\/people/, "رسالة الفراغ توجّه لأقسام مفيدة");

// عيّنة قصص السيرة: لا تبقَ بطاقات قصيرة جدًا بلا توسعة
{
  const seerah019 = JSON.parse(read("public/data/stories/سيرة-019.json"));
  const short = (Array.isArray(seerah019) ? seerah019 : []).filter(
    (s: { full_content?: string }) =>
      String(s.full_content || "").trim().split(/\s+/).filter(Boolean).length < 80,
  );
  assert.equal(short.length, 0, "سيرة-019 بلا قصص أقل من 80 كلمة");
}

// فقه books.json: لا حشو عام، وعمق حدّ أدنى للملخص والدليل
{
  const books = JSON.parse(read("content/fiqh/books.json"));
  const stubRe = /مدخل إلى|يتناول هذا المبحث|الأصل في مسائل/;
  let lessons = 0;
  for (const book of books.books || []) {
    for (const ch of book.chapters || []) {
      for (const lesson of ch.lessons || []) {
        lessons += 1;
        const blob = `${lesson.title || ""}\n${lesson.summary || ""}\n${lesson.evidence || ""}`;
        assert.doesNotMatch(blob, stubRe, `لا حشو عام في ${book.id}/${ch.id}/${lesson.id}`);
        assert.ok(
          String(lesson.summary || "").trim().length >= 80,
          `ملخص ≥80: ${lesson.id}`,
        );
        assert.ok(
          String(lesson.evidence || "").trim().length >= 40,
          `دليل ≥40: ${lesson.id}`,
        );
      }
    }
  }
  assert.ok(lessons >= 50, `مسائل فقه كافية (الآن ${lessons})`);
}

// الخط الزمني: أجسام كافية بلا عبارات تأجيل
{
  const timeline = JSON.parse(read("public/data/knowledge/history/timeline.json"));
  const items = timeline.items || [];
  assert.ok(items.length >= 1, "timeline.json فيه عناصر");
  const deferRe = /يُربط لاحقاً|حقبة ضمن الخط الزمني/;
  for (const item of items) {
    const body = String(item.body || "").trim();
    assert.ok(body.length >= 400, `timeline body≥400: ${item.id}`);
    assert.doesNotMatch(body, deferRe, `timeline بلا تأجيل: ${item.id}`);
  }
}

console.log("content-depth-audit-gate.test.ts: ok");
