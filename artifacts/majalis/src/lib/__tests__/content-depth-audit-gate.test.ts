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

// الأنبياء: نبذ حية كافية + ربط بطبقة المعرفة في واجهة التفاصيل
{
  const prophetsTs = read("src/lib/prophets-data.ts");
  const bios = [...prophetsTs.matchAll(/briefBio:\s*\n\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(bios.length, 25, "٢٥ نبذة للأنبياء");
  assert.ok(
    bios.every((b) => b.trim().split(/\s+/).filter(Boolean).length >= 40),
    "كل briefBio ≥40 كلمة",
  );
  const prophetPage = read("src/views/ProphetStoriesPage.tsx");
  assert.match(prophetPage, /getKnowledgeItem/, "صفحة الأنبياء تحمّل مقال المعرفة");
  assert.match(prophetPage, /عرض موسّع/, "قسم العرض الموسّع ظاهر في الواجهة");
}

// اقتباسات أقسام أساسية لا تبقى بلا آية/حديث مناسب
{
  const tpl = read("src/config/section-template.ts");
  for (const route of ["/prophets", "/fiqh", "/duas", "/tawhid", "/scholars", "/lessons", "/nations"]) {
    assert.match(tpl, new RegExp(`"${route.replace("/", "\\/")}"\\s*:`), `اقتباس لـ ${route}`);
  }
  assert.match(tpl, /العنكبوت:\s*٤٠/, "آية الأمم السابقة مناسبة لموضوع العذاب والعبرة");
}

// أمم كانت يتيمة في المعرفة أصبحت في البذرة الحية
{
  const seed = read("src/lib/nations-seed.ts");
  assert.match(seed, /knowledge-extras/, "تسجيل الأمم الإضافية");
  assert.match(seed, /ASHAB_KAHF/, "أصحاب الكهف في البذرة");
  assert.match(seed, /ASHAB_UKHDUD/, "أصحاب الأخدود في البذرة");
  assert.match(seed, /QAWM_YUNUS/, "قوم يونس في البذرة");
  assert.match(seed, /RUM_FURS/, "الروم والفرس في البذرة");
}

// بنك قصص الأنبياء: لا يبقى على أربع بطاقات فقط
{
  const anbiya = JSON.parse(read("public/data/stories/أنبياء-015.json"));
  const list = Array.isArray(anbiya) ? anbiya : [];
  assert.ok(list.length >= 10, `قصص أنبياء ≥10 (الآن ${list.length})`);
  assert.ok(
    list.every(
      (s: { title?: string; full_content?: string; sources?: unknown[] }) =>
        Boolean(s.title && s.full_content && Array.isArray(s.sources) && s.sources.length > 0),
    ),
    "كل قصة عنوان ومحتوى ومصدر",
  );
  const short = list.filter(
    (s: { full_content?: string }) =>
      String(s.full_content || "").trim().split(/\s+/).filter(Boolean).length < 80,
  );
  assert.equal(short.length, 0, "لا قصص أنبياء أقل من 80 كلمة");
}

// اكتشف الإسلام: لا محطات إنجليزية وهمية
{
  const discover = JSON.parse(read("public/data/knowledge/discover-islam/path-and-faq.json"));
  const items = Array.isArray(discover) ? discover : discover.items || [];
  assert.ok(
    items.every((i: { id?: string; title?: string }) => !String(i.id || "").startsWith("discover-path-en-")),
    "لا discover-path-en stubs",
  );
  assert.ok(
    items.every((i: { title?: string }) => !/Station\s+\d+\s*\(English\)/i.test(String(i.title || ""))),
    "لا عناوين Station English",
  );
}

console.log("content-depth-audit-gate.test.ts: ok");
