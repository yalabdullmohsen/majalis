/**
 * بوابات فقه حنبلية: 17 كتابًا منشورة ← أبواب ← مسائل موثَّقة.
 * التشغيل: pnpm exec tsx src/lib/__tests__/fiqh-books-gates.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FIQH_CATEGORY_ORDER,
  FIQH_SUPPORTING_TOPICS,
  adjacentFiqhLessons,
  chapterHref,
  getAllFiqhBooks,
  getFiqhBookAliases,
  getFiqhChapter,
  getFiqhLesson,
  isPublishedChapter,
  isPublishedLesson,
  listPublishedChapters,
  listPublishedLessons,
  publishedBooks,
  publishedChapters,
  searchFiqhCatalog,
  searchFiqhLessons,
} from "../fiqh-books";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function read(rel: string) {
  return readFileSync(resolve(appRoot, rel), "utf8");
}

const REQUIRED_TITLES = [
  "كتاب الطهارة",
  "كتاب الصلاة",
  "كتاب الجنائز",
  "كتاب الزكاة",
  "كتاب الصيام",
  "كتاب الاعتكاف",
  "كتاب الحج والمناسك",
  "كتاب الجهاد والسير",
  "كتاب البيوع والمعاملات",
  "كتاب الشركة والمعاوضات",
  "كتاب الوصايا والفرائض",
  "كتاب النكاح والأسرة",
  "كتاب الجنايات والديات والحدود",
  "كتاب الأطعمة والذبائح",
  "كتاب الأيمان والنذور والكفارات",
  "كتاب القضاء والشهادات والدعاوى",
  "كتاب العتق",
] as const;

const FORBIDDEN = ["pending_review", "مؤجل", "قيد الإضافة", "قريبًا", "سيتم لاحقًا"] as const;

console.log("\n=== ترتيب علمي للكتب ===");
{
  const ids = getAllFiqhBooks().map((b) => b.id);
  const pos = (id: string) => ids.indexOf(id);
  assert(pos("taharah") >= 0 && pos("taharah") < pos("salah"), "الطهارة قبل الصلاة");
  assert(pos("salah") < pos("zakat"), "الصلاة قبل الزكاة");
  assert(pos("zakat") < pos("sawm"), "الزكاة قبل الصيام");
  assert(pos("sawm") < pos("itikaf"), "الصيام قبل الاعتكاف");
  assert(pos("itikaf") < pos("hajj"), "الاعتكاف قبل الحج");
  assert(pos("hajj") < pos("janaza"), "الحج قبل الجنائز — لا جنائز قبل الزكاة/الصيام");
  assert(pos("zakat") < pos("janaza"), "الزكاة قبل الجنائز");
  assert(pos("sawm") < pos("janaza"), "الصيام قبل الجنائز");
  assert(FIQH_CATEGORY_ORDER[0] === "ibadat", "العبادات أول مجموعة");
}

console.log("\n=== ١) سبعة عشر كتابًا منشورة بعناوين مطلوبة ===");
{
  const books = getAllFiqhBooks();
  assert(books.length === 17, `عدد الكتب 17 (الفعلي ${books.length})`);
  assert(publishedBooks().length === 17, "كل الكتب ظاهرة/منشورة");
  for (const b of books) {
    assert(b.title.startsWith("كتاب "), `يبدأ بكتاب: ${b.id}`);
    assert(Boolean(b.description?.trim()), `وصف للكتاب ${b.id}`);
  }
  const titles = new Set(books.map((b) => b.title));
  for (const t of REQUIRED_TITLES) {
    assert(titles.has(t), `موجود: ${t}`);
  }
  const ids = books.map((b) => b.id);
  assert(new Set(ids).size === ids.length, "معرفات الكتب فريدة");
}

console.log("\n=== ٢) أبواب ومسائل منشورة موثَّقة ===");
{
  let chapters = 0;
  let lessons = 0;
  const chapterKeys = new Set<string>();
  const lessonIds = new Set<string>();
  for (const b of getAllFiqhBooks()) {
    for (const c of b.chapters) {
      chapters++;
      const key = `${b.id}/${c.id}`;
      assert(!chapterKeys.has(key), `باب فريد: ${key}`);
      chapterKeys.add(key);
      assert(isPublishedChapter(c), `باب منشور: ${key}`);
      assert(Boolean(c.definition?.trim()), `تعريف: ${key}`);
      assert(Boolean(c.summary?.trim()), `خلاصة: ${key}`);
      assert((c.sources?.length ?? 0) >= 1, `مصادر الباب: ${key}`);
      for (const l of c.lessons) {
        lessons++;
        assert(!lessonIds.has(l.id), `مسألة فريدة: ${l.id}`);
        lessonIds.add(l.id);
        assert(l.bookId === b.id && l.chapterId === c.id, `ربط المسألة ${l.id}`);
        assert(isPublishedLesson(l), `مسألة منشورة: ${l.id}`);
      }
      assert(publishedChapters(b).some((x) => x.id === c.id), `الباب ظاهر في ${b.id}`);
    }
  }
  assert(chapters >= 200, `أبواب كافية (الفعلي ${chapters})`);
  assert(lessons >= 400, `مسائل كافية (الفعلي ${lessons})`);
  assert(listPublishedChapters().length === chapters, "listPublishedChapters يغطي الكل");
  assert(listPublishedLessons().length === lessons, "listPublishedLessons يغطي الكل");
}

console.log("\n=== ٣) aliases للكتب المدمجة ===");
{
  const aliases = getFiqhBookAliases();
  assert(aliases.length >= 20, `aliases كافية (الفعلي ${aliases.length})`);
  const rahn = aliases.find((a) => a.aliasId === "rahn");
  assert(Boolean(rahn && rahn.targetBookId === "buyu"), "كتاب الرهن → البيوع");
  const ch = getFiqhChapter("rahn", "rahn");
  assert(Boolean(ch && ch.book.id === "buyu"), "resolve alias يفتح باب الرهن");
}

console.log("\n=== ٤) البحث داخل الفقه فقط ===");
{
  const { books, chapters, lessons } = searchFiqhCatalog("الطهارة");
  assert(books.some((b) => b.id === "taharah"), "بحث يجد كتاب الطهارة");
  assert(chapters.length > 0, "بحث يجد أبوابًا");
  assert(lessons.length > 0, "بحث يجد مسائل");
  const water = searchFiqhLessons("المياه");
  assert(water.length > 0, "بحث المياه يعيد مسائل");
  assert(water.every((h) => h.href.startsWith("/fiqh/")), "نتائج البحث داخل /fiqh");
}

console.log("\n=== ٥) مسارات الأبواب والمجاورة ===");
{
  const books = publishedBooks();
  const first = books[0]!;
  const ch = publishedChapters(first)[0]!;
  const href = chapterHref(first.id, ch.id);
  assert(href === `/fiqh/books/${first.id}/chapters/${ch.id}`, "مسار الباب");
  const lesson = ch.lessons[0]!;
  const hit = getFiqhLesson(first.id, lesson.id);
  assert(Boolean(hit), "getFiqhLesson");
  const adj = adjacentFiqhLessons(first.id, lesson.id);
  assert(adj.chapterHits.length >= 1, "مسائل الباب في المجاورة");
}

console.log("\n=== ٦) لا عبارات تأجيل في الكتالوج، وواجهة الأبواب موجودة ===");
{
  const catalog = read("content/fiqh/books.json");
  for (const bad of FORBIDDEN) {
    assert(!catalog.includes(bad), `الكتالوج بلا «${bad}»`);
  }
  const view = read("src/pages/fiqh/ui/FiqhBookView.tsx");
  assert(view.includes("/chapters/") || view.includes("chapterHref"), "صفحة الكتاب تربط بالأبواب");
  assert(existsSync(resolve(appRoot, "src/pages/fiqh/ui/FiqhChapterView.tsx")), "صفحة الباب موجودة");
}

console.log("\n=== ٧) المساندة لا تُخلط بشبكة الكتب ===");
{
  const supportTitles = FIQH_SUPPORTING_TOPICS.map((t) => t.title);
  assert(new Set(supportTitles).size === supportTitles.length, "عناوين المساندة فريدة");
  assert(!supportTitles.includes("المكتبة العلمية"), "لا بطاقة المكتبة العلمية");
}

console.log(`\nالنتيجة: ${passed} نجاح / ${failed} فشل`);
if (failed > 0) process.exit(1);
