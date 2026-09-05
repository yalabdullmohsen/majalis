/**
 * بوابة ترتيب بوابة الفقه — كتب ظاهرة مع بحث داخل الفقه.
 * تشغيل: node --import tsx src/lib/__tests__/fiqh-hub-layout-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getAllFiqhBooks, publishedBooks, searchFiqhCatalog } from "@/lib/fiqh-books";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const view = readFileSync(resolve(root, "src/pages/fiqh/ui/FiqhView.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/pages/fiqh-hub.css"), "utf8");

assert.match(view, /كتب الفقه/);
assert.match(view, /searchFiqhCatalog/);
assert.match(view, /publishedBooks/);
assert.match(view, /fiqh-book-grid|fiqh-book-card/);
assert.doesNotMatch(view, /سيضاف محتوى هذا الباب قريبًا/);
assert.doesNotMatch(view, /المكتبة العلمية/);
assert.match(css, /fiqh-book-grid|fiqh-book-card/);

const books = publishedBooks();
assert.equal(books.length, 17, `17 كتابًا منشورًا (الآن ${books.length})`);
assert.equal(getAllFiqhBooks().length, 17);

const hits = searchFiqhCatalog("الطهارة");
assert.ok(hits.books.some((b) => b.id === "taharah"));
assert.ok(hits.chapters.length > 0);

console.log("fiqh-hub-layout-gate.test.ts: ok");
