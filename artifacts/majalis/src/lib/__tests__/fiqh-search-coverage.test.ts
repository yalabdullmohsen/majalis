/**
 * تغطية بحث الفقه للكلمات الأساسية من الكتب/الأبواب الصحيحة.
 * التشغيل: pnpm exec tsx src/lib/__tests__/fiqh-search-coverage.test.ts
 */
import { searchFiqhCatalog } from "../fiqh-books";

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

const CASES: Array<{
  q: string;
  expectBookId: string;
  forbidBookIds?: string[];
}> = [
  { q: "الطهارة", expectBookId: "taharah" },
  { q: "الصلاة", expectBookId: "salah" },
  { q: "الزكاة", expectBookId: "zakat", forbidBookIds: ["taharah", "buyu"] },
  { q: "الحج", expectBookId: "hajj" },
  { q: "البيع", expectBookId: "buyu" },
  { q: "النكاح", expectBookId: "nikah" },
  { q: "الطلاق", expectBookId: "nikah", forbidBookIds: ["salah"] },
  { q: "الجنايات", expectBookId: "jinayat", forbidBookIds: ["janaza"] },
  { q: "القضاء", expectBookId: "qada" },
  { q: "العتق", expectBookId: "itq" },
];

console.log("\n=== fiqh search coverage ===");

for (const c of CASES) {
  const hit = searchFiqhCatalog(c.q);
  const inBooks = hit.books.some((b) => b.id === c.expectBookId);
  const inChapters = hit.chapters.some((h) => h.book.id === c.expectBookId);
  const inLessons = hit.lessons.some((h) => h.book.id === c.expectBookId);
  assert(inBooks || inChapters || inLessons, `«${c.q}» يصل إلى ${c.expectBookId}`);
  assert(hit.books.length + hit.chapters.length + hit.lessons.length > 0, `«${c.q}» له نتائج`);
  for (const bad of c.forbidBookIds ?? []) {
    assert(!hit.books.some((b) => b.id === bad), `«${c.q}» لا يخلط كتاب ${bad} في نتائج الكتب`);
  }
}

console.log(`\nالنتيجة: ${passed} نجاح / ${failed} فشل`);
if (failed > 0) process.exit(1);
