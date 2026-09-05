/**
 * بوابة سجل الفقه — 17 كتابًا ظاهرة مع أبواب ومسائل.
 * تشغيل: pnpm exec tsx src/lib/__tests__/fiqh-registry-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFiqhRegistry, searchFiqhRegistry } from "../../config/fiqh.registry.ts";
import { getAllFiqhBooks } from "../fiqh-books.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pkg = readFileSync(resolve(root, "package.json"), "utf8");

const registry = buildFiqhRegistry();
assert.equal(registry.length, 17, `كتب ظاهرة = 17 (الآن ${registry.length})`);

for (const book of registry) {
  assert.match(book.title, /^كتاب /, `عنوان كتاب: ${book.id}`);
  assert.ok(book.order >= 1, `ترتيب الكتاب ${book.id}`);
  assert.ok(book.chapters.length >= 1, `كتاب بلا أبواب ظاهرة: ${book.id}`);
  for (const ch of book.chapters) {
    assert.ok(ch.lessons.length >= 1, `باب بلا مسائل: ${book.id}/${ch.id}`);
    assert.ok(ch.order >= 1, `ترتيب الباب ${ch.id}`);
    for (const lesson of ch.lessons) {
      assert.ok(lesson.href.includes("/fiqh/books/"), lesson.id);
      assert.ok(lesson.sources.length >= 1, `بلا مصدر: ${lesson.id}`);
    }
  }
}

for (const book of getAllFiqhBooks()) {
  for (const ch of book.chapters) {
    assert.ok((ch.lessons?.length ?? 0) >= 1, `باب فارغ في المصدر: ${book.id}/${ch.id}`);
  }
}

assert.ok(searchFiqhRegistry("طهار").length >= 1, "البحث يعيد نتائج جزئية");
assert.match(pkg, /verify:fiqh-registry/);

console.log(`fiqh-registry-gate: ok (${registry.length} كتب ظاهرة)`);
