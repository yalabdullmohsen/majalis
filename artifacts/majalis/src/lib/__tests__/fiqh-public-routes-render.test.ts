/**
 * مسارات الفقه العامة قابلة للحل والعرض (كتاب/باب) بمحتوى غير فارغ.
 * التشغيل: pnpm exec tsx src/lib/__tests__/fiqh-public-routes-render.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  bookHref,
  chapterHref,
  getFiqhChapter,
  listPublishedChapters,
  publishedBooks,
} from "../fiqh-books";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== public fiqh routes render ===");

const routesFile = readFileSync(resolve(appRoot, "src/AppRoutes.tsx"), "utf8");
assert(routesFile.includes('path="/fiqh"'), "مسار /fiqh");
assert(routesFile.includes('path="/fiqh/books/:bookId"'), "مسار الكتاب");
assert(
  routesFile.includes('path="/fiqh/books/:bookId/chapters/:chapterId"'),
  "مسار الباب",
);

const hub = readFileSync(resolve(appRoot, "src/pages/fiqh/ui/FiqhView.tsx"), "utf8");
assert(hub.includes("publishedBooks"), "الواجهة تعرض الكتب أولًا عبر publishedBooks");
assert(hub.includes('dir="rtl"') || hub.includes("fiqh-lux"), "واجهة الفقه RTL");

const bookView = readFileSync(resolve(appRoot, "src/pages/fiqh/ui/FiqhBookView.tsx"), "utf8");
assert(bookView.includes("chapterHref") || bookView.includes("publishedChapters"), "صفحة الكتاب تعرض أبوابه");
assert(bookView.includes("الفقه"), "breadcrumb يبدأ من الفقه");
assert(bookView.includes("مصادر الكتاب") || bookView.includes("sources"), "صفحة الكتاب تعرض المصادر");

const chapterView = readFileSync(resolve(appRoot, "src/pages/fiqh/ui/FiqhChapterView.tsx"), "utf8");
assert(chapterView.includes("تعريف الباب"), "صفحة الباب تعرض التعريف");
assert(chapterView.includes("موضوعات الباب"), "صفحة الباب تعرض الموضوعات");
assert(chapterView.includes("خلاصة فقهية") || chapterView.includes("خلاصة"), "صفحة الباب تعرض الخلاصة");
assert(chapterView.includes("المصادر"), "صفحة الباب تعرض المصادر");
assert(chapterView.includes("الفقه"), "breadcrumb الباب يتضمن الفقه");

const cssPath = resolve(appRoot, "src/styles/pages/fiqh-hub.css");
assert(existsSync(cssPath), "ملف أنماط الفقه موجود");
const css = readFileSync(cssPath, "utf8");
assert(
  css.includes("data-theme=\"dark\"") || css.includes("html.dark") || css.includes("prefers-color-scheme"),
  "أنماط تدعم الوضع الليلي/الفاتح",
);

const books = publishedBooks();
assert(books.length >= 17, `كتب منشورة كافية (${books.length})`);

for (const book of books) {
  assert(bookHref(book.id) === `/fiqh/books/${book.id}`, `href كتاب: ${book.id}`);
  assert(Boolean(book.description?.trim()), `صفحة كتاب غير فارغة: ${book.id}`);
}

let renderedChapters = 0;
for (const hit of listPublishedChapters()) {
  const resolved = getFiqhChapter(hit.book.id, hit.chapter.id);
  assert(Boolean(resolved), `مسار باب يُحل: ${hit.book.id}/${hit.chapter.id}`);
  assert(
    chapterHref(hit.book.id, hit.chapter.id) ===
      `/fiqh/books/${hit.book.id}/chapters/${hit.chapter.id}`,
    `href باب: ${hit.book.id}/${hit.chapter.id}`,
  );
  const ch = resolved!.chapter;
  const body = [ch.definition, ch.summary, ch.evidence, ch.notes, ...(ch.topics ?? [])]
    .join(" ")
    .trim();
  assert(body.length >= 80, `محتوى باب غير فارغ للعرض: ${hit.book.id}/${hit.chapter.id}`);
  renderedChapters++;
}

assert(renderedChapters === listPublishedChapters().length, "كل أبواب الفقه قابلة للعرض");
console.log(`  · أبواب جاهزة للعرض: ${renderedChapters}`);

console.log(`\nالنتيجة: ${passed} نجاح / ${failed} فشل`);
if (failed > 0) process.exit(1);
