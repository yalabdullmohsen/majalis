import assert from "node:assert/strict";
import { parseQuickNav } from "@/features/search/quick-nav";
import { searchUnifiedIndex, type UnifiedSearchDoc } from "@/features/search/unified-local";

const q1 = parseQuickNav("البقرة ٢٥٥");
assert.ok(q1?.href.includes("quran"), "آية البقرة");
const q2 = parseQuickNav("صحيح البخاري 1");
assert.ok(q2?.href.includes("hadith"), "حديث البخاري");
assert.equal(parseQuickNav(""), null);

const docs: UnifiedSearchDoc[] = [
  {
    id: "scholar:abu-hanifa",
    kind: "scholar",
    titleAr: "أبو حنيفة",
    href: "/scholars/abu-hanifa",
    norm: "ابو حنيفه النعمان",
  },
  {
    id: "book:x",
    kind: "book",
    titleAr: "الموطأ",
    href: "/library/x",
    norm: "الموطا مالك",
  },
];

const hits = searchUnifiedIndex(docs, "حنيف");
assert.ok((hits.scholar?.length ?? 0) >= 1, "بحث عالم");
const hits2 = searchUnifiedIndex(docs, "الموطأ");
assert.ok((hits2.book?.length ?? 0) >= 1, "بحث كتاب");

console.log("unified-search.test.ts: ok");
