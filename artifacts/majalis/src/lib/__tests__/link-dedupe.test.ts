/**
 * انحدار: تطبيع وإزالة تكرار الروابط الداخلية.
 * التشغيل: node --import tsx src/lib/__tests__/link-dedupe.test.ts
 */
import {
  dedupeLinksByHref,
  findDuplicateHrefs,
  normalizeLinkHref,
} from "../link-dedupe";

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

console.log("\n=== normalizeLinkHref ===");
assert(normalizeLinkHref("/fiqh/") === "/fiqh", "يزيل الشرطة النهائية");
assert(normalizeLinkHref("https://majlisilm.com/fiqh") === "/fiqh", "يُحوّل المطلق إلى مسار");
assert(normalizeLinkHref("/lessons") === normalizeLinkHref("/lessons/"), "مساران متكافئان");

console.log("\n=== dedupeLinksByHref ===");
const deduped = dedupeLinksByHref([
  { href: "/lessons", label: "الدروس" },
  { href: "/lessons", label: "الدروس والدورات" },
  { href: "/fiqh", label: "الفقه" },
]);
assert(deduped.length === 2, "يُزيل href مكرر ويحفظ الأول");
assert(deduped[0].label === "الدروس", "أول ظهور يبقى");

console.log("\n=== findDuplicateHrefs ===");
assert(
  findDuplicateHrefs([
    { href: "/fiqh" },
    { href: "/fiqh" },
    { href: "/quiz" },
  ]).join(",") === "/fiqh",
  "يكتشف التكرار",
);

console.log(`\nالنتيجة: ${passed}/${passed + failed}`);
if (failed) process.exit(1);
