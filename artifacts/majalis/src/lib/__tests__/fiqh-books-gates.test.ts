/**
 * بوابات إعادة بناء الفقه: كتاب ← باب ← مسألة.
 * التشغيل: node --import tsx src/lib/__tests__/fiqh-books-gates.test.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FIQH_CATEGORY_ORDER,
  FIQH_SUPPORTING_TOPICS,
  adjacentFiqhLessons,
  getAllFiqhBooks,
  getFiqhLesson,
  isPublishedLesson,
  listPublishedLessons,
  publishedBooks,
  publishedChapters,
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
  "كتاب الطهارة", "كتاب الصلاة", "كتاب الجنائز", "كتاب الزكاة", "كتاب الصيام",
  "كتاب الاعتكاف", "كتاب الحج والعمرة", "كتاب الأضحية والعقيقة", "كتاب الأيمان والنذور",
  "كتاب الذكاة والصيد", "كتاب الأطعمة والأشربة", "كتاب اللباس والزينة",
  "كتاب البيوع", "كتاب الربا والصرف", "كتاب الخيار", "كتاب السلم والاستصناع",
  "كتاب الإجارة", "كتاب الشركة والمضاربة", "كتاب الرهن", "كتاب الضمان والكفالة",
  "كتاب الحوالة", "كتاب الوكالة", "كتاب القرض والدين", "كتاب الشفعة",
  "كتاب المساقاة والمزارعة", "كتاب الوقف", "كتاب الهبة والعطية", "كتاب الوصايا",
  "كتاب الفرائض والمواريث", "كتاب اللقطة", "كتاب الغصب", "كتاب إحياء الموات",
  "كتاب النكاح", "كتاب الصداق", "كتاب العشرة والقَسْم", "كتاب الخلع", "كتاب الطلاق",
  "كتاب الرجعة", "كتاب الإيلاء والظهار واللعان", "كتاب العِدد", "كتاب الرضاع",
  "كتاب النفقات والحضانة",
  "كتاب الجنايات", "كتاب الديات", "كتاب القسامة", "كتاب الحدود", "كتاب البغاة",
  "كتاب الجهاد والسِّيَر", "كتاب الجزية",
  "كتاب القضاء", "كتاب الشهادات", "كتاب الدعوى والبيّنات", "كتاب الإقرار",
];

console.log("\n=== ترتيب علمي للكتب ===");
{
  const ids = getAllFiqhBooks().map((b) => b.id);
  const pos = (id: string) => ids.indexOf(id);
  assert(pos("taharah") >= 0 && pos("taharah") < pos("salah"), "الطهارة قبل الصلاة");
  assert(pos("salah") < pos("zakat"), "الصلاة قبل الزكاة");
  assert(pos("zakat") < pos("sawm"), "الزكاة قبل الصيام");
  assert(pos("sawm") < pos("hajj"), "الصيام قبل الحج");
  assert(FIQH_CATEGORY_ORDER[0] === "ibadat", "العبادات أول مجموعة");
  assert(FIQH_CATEGORY_ORDER.includes("muamalat"), "المعاملات");
  assert(FIQH_CATEGORY_ORDER.includes("usrah"), "الأسرة");
  assert(FIQH_CATEGORY_ORDER.includes("jinayat"), "الجنايات والحدود");
}

console.log("\n=== ١) كل عنوان كتاب يبدأ بـ«كتاب» ===");
{
  const books = getAllFiqhBooks();
  assert(books.length === 53, `عدد الكتب 53 (الفعلي ${books.length})`);
  for (const b of books) {
    assert(b.title.startsWith("كتاب "), `يبدأ بكتاب: ${b.id}`);
  }
  const titles = new Set(books.map((b) => b.title));
  for (const t of REQUIRED_TITLES) {
    assert(titles.has(t), `موجود: ${t}`);
  }
}

console.log("\n=== ٢) صفر درس بلا bookId/chapterId أو مصادر ===");
{
  const books = getAllFiqhBooks();
  let lessons = 0;
  for (const b of books) {
    for (const c of b.chapters) {
      for (const l of c.lessons) {
        lessons++;
        assert(Boolean(l.bookId) && Boolean(l.chapterId), `${l.id} له كتاب وباب`);
        assert(l.bookId === b.id && l.chapterId === c.id, `${l.id} يطابق موضعه`);
        if (l.status === "published") {
          assert(isPublishedLesson(l), `${l.id} منشور بمصادر كاملة`);
          assert(Boolean(l.summary?.trim()), `${l.id} له تحرير`);
          assert(Boolean(l.evidence?.trim()), `${l.id} له أدلة`);
          assert(Boolean(l.preferred?.trim()), `${l.id} له راجح`);
        }
      }
    }
  }
  assert(lessons >= 50, `مسائل كافية للاختبار (الفعلي ${lessons})`);
}

console.log("\n=== ٣) صفر درس فقهي في مصادر الأقسام الأخرى ===");
{
  const ids = listPublishedLessons().map((h) => h.lesson.id);
  const otherFiles = [
    "src/data/learning-paths-index.ts",
    "src/lib/annual-courses-seed.ts",
    "src/lib/updates-seed.ts",
    "src/pages/quran/ui/QuranHubView.tsx",
    "src/views/KnowledgeSectionPage.tsx",
  ];
  for (const f of otherFiles) {
    const src = existsSync(resolve(appRoot, f)) ? read(f) : "";
    const leaked = ids.filter((id) => src.includes(`"${id}"`) || src.includes(`'${id}'`));
    assert(leaked.length === 0, `${f} بلا معرفات مسائل الفقه (${leaked.slice(0, 3).join(",") || "لا شيء"})`);
  }
  const view = read("src/pages/fiqh/ui/FiqhView.tsx");
  assert(!view.includes("@/pages/lessons") && !view.includes("/quran-hub"), "بوابة الفقه لا تدمج مركز القرآن الكريم/الدروس");
}

console.log("\n=== ٤) صفر تكرار مسار أو عنوان في الشبكة ===");
{
  const books = publishedBooks();
  const titles = books.map((b) => b.title);
  assert(new Set(titles).size === titles.length, "عناوين الكتب الظاهرة فريدة");
  const hrefs = [
    ...books.map((b) => `/fiqh/books/${b.id}`),
    ...FIQH_SUPPORTING_TOPICS.map((t) => t.href),
  ];
  assert(new Set(hrefs).size === hrefs.length, "مسارات البطاقات الظاهرة فريدة");
  const supportTitles = FIQH_SUPPORTING_TOPICS.map((t) => t.title);
  assert(new Set(supportTitles).size === supportTitles.length, "عناوين المساندة فريدة");
  assert(!supportTitles.includes("الأحكام الشرعية"), "لا بطاقة الأحكام الشرعية");
  assert(!supportTitles.includes("المجمع الفقهي") || !supportTitles.includes("قرارات المجامع"), "مدخل مجامع واحد");
  const view = read("src/pages/fiqh/ui/FiqhView.tsx");
  assert(!view.includes("الأحكام الشرعية"), "الواجهة بلا الأحكام الشرعية");
  assert(!view.includes("يجري استكمال"), "الواجهة بلا استكمال توثيق");
}

console.log("\n=== ٥–٦) شرائح nowrap + أيقونة وتسمية ===");
{
  const css = read("src/components/lobby/section-lobby.css");
  assert(/white-space:\s*nowrap/.test(css), "شرائح nowrap");
  assert(/overflow-x:\s*auto/.test(css), "overflow-x auto");
  assert(/scroll-snap-type:\s*x/.test(css), "scroll-snap");
  const view = read("src/pages/fiqh/ui/FiqhView.tsx");
  assert(view.includes("SectionLobby"), "الفقه من SectionLobby");
  assert(view.includes("chips={lobby.chips}"), "شريط المجموعات من السجل");
}

console.log("\n=== ٧) بطاقات متساوية الارتفاع ===");
{
  const css = read("src/components/lobby/section-lobby.css");
  assert(/grid-auto-rows:\s*1fr/.test(css), "الشبكة 1fr");
  assert(/section-lobby__grid--solo/.test(css), "صف كامل للعنصر الواحد");
}

console.log("\n=== ٨) نطاق الزر العائم وsafe-area ===");
{
  const css = read("src/components/lobby/section-lobby.css");
  assert(css.includes("assistant-fab-size"), "نطاق FAB محجوز");
}

console.log("\n=== ٩) صفر صفحة قيد المراجعة أو فارغة ===");
{
  const view = read("src/pages/fiqh/ui/FiqhView.tsx");
  const bookView = read("src/pages/fiqh/ui/FiqhBookView.tsx");
  const lessonView = read("src/pages/fiqh/ui/FiqhLessonView.tsx");
  for (const [name, src] of [["hub", view], ["book", bookView], ["lesson", lessonView]] as const) {
    assert(!/قيد المراجعة/.test(src), `${name} بلا قيد المراجعة`);
  }
  const visible = publishedBooks();
  assert(visible.length === getAllFiqhBooks().length, "لا كتاب فارغ معروض (كل الكتب لها مسائل منشورة)");
  for (const b of visible) {
    assert(publishedChapters(b).length > 0, `${b.id} له أبواب منشورة`);
  }
  assert(existsSync(resolve(appRoot, "content/fiqh/FIQH_CONTENT_QUEUE.md")), "طابور المحتوى موجود");
}

console.log("\n=== ١٠) البحث: ٥٠ عيّنة ===");
{
  const hits = listPublishedLessons();
  assert(hits.length >= 50, `مسائل منشورة ≥ 50 (الفعلي ${hits.length})`);
  const samples: { q: string; kind: string }[] = [];
  for (const h of hits.slice(0, 20)) {
    samples.push({ q: h.lesson.title, kind: "lesson" });
  }
  for (const h of hits.slice(0, 15)) {
    samples.push({ q: h.chapter.title.replace(/^باب\s+/, ""), kind: "chapter" });
  }
  for (const b of publishedBooks().slice(0, 15)) {
    samples.push({ q: b.title.replace(/^كتاب\s+/, ""), kind: "book" });
  }
  assert(samples.length >= 50, `عيّنات البحث ≥ 50 (الفعلي ${samples.length})`);
  let missed = 0;
  for (const s of samples) {
    const found = searchFiqhLessons(s.q);
    if (found.length === 0) {
      missed++;
      console.error(`    missed ${s.kind}: ${s.q}`);
    }
  }
  assert(missed === 0, `البحث يجد العيّنات الخمسين (فائت ${missed})`);
  const taimum = searchFiqhLessons("التيمم");
  assert(
    taimum.some((h) => h.path.includes("كتاب الطهارة") && h.path.includes("باب التيمم")),
    "نتيجة التيمم تعرض المسار الكامل",
  );
}

console.log("\n=== البنية والواجهة ===");
{
  const view = read("src/pages/fiqh/ui/FiqhView.tsx");
  assert(view.includes("getFiqhLobby") || view.includes("section-lobbies-fiqh"), "خمس مجموعات من المصدر");
  assert(view.includes('import("@/config/section-lobbies-fiqh")') || view.includes("section-lobbies-fiqh"), "لوبي فقه كسول/معزول");
  assert(view.includes("FIQH_HUB_STATS") || view.includes("fiqh-hub-stats"), "بطل الفقه بلا fiqh-books متزامن");
  assert(view.includes("lobbyId=\"fiqh\""), "معرّف لوبي الفقه");
  assert(view.includes("title={lobby.title}"), "هيدر مختصر بلا فقرة طويلة");
  const bookView = read("src/pages/fiqh/ui/FiqhBookView.tsx");
  assert(bookView.includes("fiqhBookBlurb"), "وصف الكتاب من العنوان");
  assert(bookView.includes("مستوى تقريبي"), "مستوى تقريبي في رأس الكتاب");
  assert(bookView.includes("fiqh-chapter--card"), "أبواب كبطاقات");
  const lessonView = read("src/pages/fiqh/ui/FiqhLessonView.tsx");
  assert(lessonView.includes("فهرس الباب"), "فهرس داخلي");
  assert(lessonView.includes("ملخص سريع"), "ملخص سريع");
  assert(lessonView.includes("الراجح بدليله"), "الراجح بدليله");
  assert(lessonView.includes("adjacentFiqhLessons"), "التالي/السابق");
  assert(lessonView.includes("fiqh-read-progress"), "شريط تقدّم قراءة");
  const water = getFiqhLesson("taharah", "taharah-miyah-aqsam");
  assert(Boolean(water), "مسألة أقسام المياه");
  const adj = adjacentFiqhLessons("taharah", "taharah-miyah-aqsam");
  assert(Boolean(adj.next), "للمسألة الأولى تالٍ");
  assert(!adj.prev, "لا سابق للأولى");
  const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
  assert(app.includes('path="/fiqh/books/:bookId"'), "مسار الكتاب");
  assert(app.includes('path="/fiqh/books/:bookId/lessons/:lessonId"'), "مسار المسألة");
  assert(app.includes('path="/fiqh/usul"'), "مسار الأصول");
  assert(app.includes('<Route path="/rulings"><Redirect to="/fiqh" />'), "/rulings → /fiqh");
}

console.log(`\n=== النتيجة: ${passed} نجاح، ${failed} فشل ===`);
if (failed > 0) process.exit(1);
