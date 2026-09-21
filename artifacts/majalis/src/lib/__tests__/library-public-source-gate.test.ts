/**
 * بوابة: السطح العام للمكتبة لا يعرض source_missing.
 * التشغيل: node --import tsx src/lib/__tests__/library-public-source-gate.test.ts
 */
import assert from "node:assert/strict";
import { LIBRARY_CATALOG } from "../library-catalog";
import {
  filterLibraryCatalog,
  getFeaturedLibraryBooks,
  getPublicLibraryCatalog,
  hasVerifiedLibrarySource,
  searchLibraryCatalog,
} from "../library-service";
import { bookRepository } from "@/entities/book/api";

const verified = LIBRARY_CATALOG.filter(hasVerifiedLibrarySource);
const missing = LIBRARY_CATALOG.filter((b) => !hasVerifiedLibrarySource(b));

assert.equal(verified.length, 18, `expected 18 verified, got ${verified.length}`);
assert.equal(missing.length, 172, `expected 172 missing, got ${missing.length}`);
assert.equal(getPublicLibraryCatalog().length, verified.length);

for (const book of getPublicLibraryCatalog()) {
  assert.ok(hasVerifiedLibrarySource(book), `public leak: ${book.id}`);
}

const featured = getFeaturedLibraryBooks(50);
assert.ok(featured.every(hasVerifiedLibrarySource));

const searchHits = searchLibraryCatalog("صحيح", 50);
assert.ok(searchHits.length > 0, "search should find verified bukhari/muslim");
assert.ok(searchHits.every(hasVerifiedLibrarySource));

const allFiltered = filterLibraryCatalog({});
assert.equal(allFiltered.length, verified.length);
const adminAll = filterLibraryCatalog({ includeUnverified: true });
assert.equal(adminAll.length, LIBRARY_CATALOG.length);

const entities = await bookRepository.getAll();
assert.equal(entities.length, verified.length);
assert.equal(await bookRepository.getBySlug(missing[0]!.id), null);

const leakId = missing[0]!.id;
const leakSearch = searchLibraryCatalog(missing[0]!.title.split(" ")[0] || "عمدة", 100);
assert.ok(
  !leakSearch.some((b) => b.id === leakId),
  `search must not return source_missing id ${leakId}`,
);

console.log("library-public-source-gate: ok", {
  verified: verified.length,
  missing: missing.length,
  public: getPublicLibraryCatalog().length,
});
