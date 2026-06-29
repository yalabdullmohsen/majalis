#!/usr/bin/env node
/**
 * Library Restructure — unit + integration regression tests.
 * Ensures books, articles, and research never mix again.
 *
 * Usage: node scripts/test-library-restructure.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mapRowToPayload } from "../lib/content-import/mappers.mjs";
import { TYPE_REGISTRY } from "../lib/content-import/registry.mjs";
import {
  classifyContentType,
  validateContentTypeForSection,
  assertNoCrossContamination,
  detailPath,
  listPath,
  splitLibrarySearchRows,
  rejectResearchInLibraryItems,
  canPublishLibraryItem,
  isContentType,
} from "../lib/library/content-types.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log(`PASS  ${msg}`);
  } else {
    fail++;
    console.error(`FAIL  ${msg}`);
  }
}

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

console.log("=== Library Restructure Unit Tests ===\n");

// ── 1. Content type classification ──────────────────────────────────────────
console.log("── 1. Content type routing ──");

ok(classifyContentType({ type: "كتاب" }) === "book", "legacy كتاب → book");
ok(classifyContentType({ type: "مقال" }) === "article", "legacy مقال → article");
ok(
  classifyContentType({ title: "رسالة ماجستير", type: "كتاب" }) === "research",
  "thesis title → research",
);
ok(classifyContentType({ type: "" }) === null, "empty type → null (unclassified)");
ok(isContentType("book") && !isContentType("paper"), "isContentType accepts book only");

ok(detailPath("book", "abc") === "/library/books/abc", "book detail → /library/books/:id");
ok(detailPath("article", "xyz") === "/library/articles/xyz", "article detail → /library/articles/:id");
ok(detailPath("research", "slug") === "/research/slug", "research detail → /research/:id");

ok(listPath("book") === "/library/books", "book list → /library/books");
ok(listPath("article") === "/library/articles", "article list → /library/articles");
ok(listPath("research") === "/research", "research list → /research");

const mixed = [
  { id: "1", content_type: "book", title: "كتاب" },
  { id: "2", content_type: "article", title: "مقال" },
  { id: "3", content_type: "book", title: "كتاب 2" },
];
ok(assertNoCrossContamination(mixed, "book").length === 2, "assertNoCrossContamination keeps books only");
ok(assertNoCrossContamination(mixed, "article").length === 1, "assertNoCrossContamination keeps articles only");

ok(!validateContentTypeForSection(undefined, "book").ok, "missing content_type rejected");
ok(!validateContentTypeForSection("article", "book").ok, "article in book section rejected");
ok(validateContentTypeForSection("book", "book").ok, "book in book section accepted");

ok(!canPublishLibraryItem({ status: "approved" }).ok, "approved without content_type blocked");
ok(!canPublishLibraryItem({ status: "approved", content_type: "research" }).ok, "research in library_items blocked");
ok(canPublishLibraryItem({ status: "approved", content_type: "book" }).ok, "approved book allowed");
ok(canPublishLibraryItem({ status: "draft", content_type: null }).ok, "draft without type allowed");

ok(!rejectResearchInLibraryItems({ title: "رسالة دكتوراه", type: "كتاب" }).ok, "research payload rejected for library_items");

// ── 2. Route wiring (static) ────────────────────────────────────────────────
console.log("\n── 2. Public routes ──");

const app = read("src/App.tsx");
for (const fragment of [
  'path="/library/books"',
  'path="/library/articles"',
  'path="/library/books/:id"',
  'path="/library/articles/:id"',
  'path="/books"',
  'path="/articles"',
  'LibraryLegacyRedirect',
  'path="/research"',
]) {
  ok(app.includes(fragment), `App.tsx includes ${fragment}`);
}

const legacy = read("src/views/LibraryLegacyRedirect.tsx");
ok(legacy.includes("detailPath"), "LibraryLegacyRedirect uses detailPath for typed redirect");

// ── 3. Search separation ────────────────────────────────────────────────────
console.log("\n── 3. Search separation ──");

const searchRows = [
  { id: "b1", content_type: "book", title: "كتاب الفقه" },
  { id: "a1", content_type: "article", title: "مقال" },
  { id: "b2", type: "كتاب", title: "متن" },
  { id: "a2", type: "مقال", title: "تفريغ" },
  { id: "r1", content_type: "research", title: "رسالة" },
];
const split = splitLibrarySearchRows(searchRows);
ok(split.books.length === 2 && split.articles.length === 2, "search split: 2 books + 2 articles");
ok(!split.books.some((r) => r.content_type === "article" || r.type === "مقال"), "books bucket has no articles");
ok(!split.articles.some((r) => r.content_type === "book" && r.type !== "مقال"), "articles bucket has no books");
ok(!split.books.some((r) => r.content_type === "research"), "books bucket excludes research");

const searchPage = read("src/views/SearchPage.tsx");
ok(searchPage.includes('title="الكتب"'), "SearchPage group: الكتب");
ok(searchPage.includes('title="المقالات"'), "SearchPage group: المقالات");
ok(searchPage.includes('title="الأبحاث العلمية"'), "SearchPage group: الأبحاث");
ok(searchPage.includes("/library/books/"), "SearchPage book href uses /library/books/");
ok(searchPage.includes("/library/articles/"), "SearchPage article href uses /library/articles/");

const supabase = read("src/lib/supabase.ts");
ok(supabase.includes("splitLibraryRows"), "supabase search uses splitLibraryRows");
ok(supabase.includes('content_type: "book"'), "supabase catalog search stamps book");
ok(supabase.includes('content_type: "article"'), "supabase catalog search stamps article");

// ── 4. Smart CMS / import ───────────────────────────────────────────────────
console.log("\n── 4. Smart CMS & import ──");

const bookPayload = mapRowToPayload("books", { title: "كتاب", author: "أ", category: "فقه" });
ok(bookPayload.content_type === "book", "import books → content_type=book");
ok(bookPayload.type === "كتاب", "import books → type=كتاب");

const articlePayload = mapRowToPayload("articles", { title: "مقال", author: "ب", category: "عقيدة" });
ok(articlePayload.content_type === "article", "import articles → content_type=article");
ok(articlePayload.type === "مقال", "import articles → type=مقال");

ok(TYPE_REGISTRY.books.table === "library_items", "registry books → library_items");
ok(TYPE_REGISTRY.articles.table === "library_items", "registry articles → library_items");
ok(!Object.values(TYPE_REGISTRY).some((d) => d.table === "library_items" && d.type === "research"), "no research in library_items registry");

const publisher = read("lib/knowledge-engine/publisher.mjs");
ok(publisher.includes('content_type: kind === "book" ? "book" : "article"'), "AKE publisher stamps content_type");
ok(!publisher.includes('research: "library_items"'), "AKE publisher: research not mapped to library_items");

const researchHandler = read("lib/api-handlers/scientific-research.js");
ok(researchHandler.includes('from("research_papers")'), "scientific research API uses research_papers");

// ── 5. Admin panels ─────────────────────────────────────────────────────────
console.log("\n── 5. Admin panels ──");

const adminNav = read("src/lib/admin-navigation.ts");
for (const slug of ["library-books", "library-articles", "scientific-research"]) {
  ok(adminNav.includes(`"${slug}"`), `admin nav slug ${slug}`);
}

const adminPage = read("src/views/AdminPage.tsx");
ok(adminPage.includes('case "library-books"'), "AdminPage library-books section");
ok(adminPage.includes('case "library-articles"'), "AdminPage library-articles section");
ok(adminPage.includes('case "scientific-research"'), "AdminPage scientific-research section");

const adminSection = read("src/views/admin/LibraryTypeAdminSection.tsx");
ok(adminSection.includes("validateContentTypeForSection"), "LibraryTypeAdminSection validates content_type");
ok(adminSection.includes("ct === contentType"), "admin filters items by content_type");
ok(adminSection.includes('contentType: ContentType'), "admin section scoped by ContentType prop");

const libraryService = read("src/lib/library-service.ts");
ok(libraryService.includes("filterLibraryByContentType"), "library-service filters by content_type");
ok(libraryService.includes("assertNoCrossContamination"), "library-service uses contamination guard");

// ── 6. List pages scoped ────────────────────────────────────────────────────
console.log("\n── 6. List page scoping ──");

const typeList = read("src/views/LibraryTypeListPage.tsx");
ok(typeList.includes("contentType"), "LibraryTypeListPage scoped by contentType");
ok(typeList.includes("detailPath(contentType"), "list page links via detailPath");

console.log(`\n=== Summary: ${pass} PASS, ${fail} FAIL ===\n`);
process.exit(fail > 0 ? 1 : 0);
