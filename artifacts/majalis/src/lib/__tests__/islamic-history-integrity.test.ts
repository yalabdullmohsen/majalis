/**
 * سلامة بيانات التاريخ الإسلامي — ≥80 عنصر، معرّفات فريدة، مصادر، توثيق.
 * npx tsx src/lib/__tests__/islamic-history-integrity.test.ts
 */
import {
  ISLAMIC_HISTORY_ITEMS,
  HISTORY_CATEGORIES,
  type HistoryCategory,
  type VerificationLevel,
} from "@/data/islamic-history";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    if (detail) console.error(`         ${detail}`);
    failed++;
  }
}

const VALID_VERIFICATION = new Set<VerificationLevel>([
  "confirmed",
  "likely",
  "disputed",
  "needs-review",
]);

console.log("\n=== حجم المحتوى ===");
assert(ISLAMIC_HISTORY_ITEMS.length >= 80, `≥80 عنصر (${ISLAMIC_HISTORY_ITEMS.length})`);

console.log("\n=== معرّفات فريدة ===");
const ids = ISLAMIC_HISTORY_ITEMS.map((i) => i.id);
assert(new Set(ids).size === ids.length, "لا تكرار في id");

console.log("\n=== حقول إلزامية ===");
for (const item of ISLAMIC_HISTORY_ITEMS) {
  assert(Boolean(item.title?.trim()), `عنوان: ${item.id}`);
  assert(Boolean(item.summary?.trim()), `ملخص: ${item.id}`);
  assert(Boolean(item.detail?.trim()), `تفصيل: ${item.id}`);
  assert(Boolean(item.era?.trim()), `عصر: ${item.id}`);
  assert(Object.keys(HISTORY_CATEGORIES).includes(item.category), `تصنيف: ${item.id}`);
  assert(Array.isArray(item.sources) && item.sources.length > 0, `مصادر: ${item.id}`);
  assert(VALID_VERIFICATION.has(item.verification), `توثيق: ${item.id}`);
}

console.log("\n=== تغطية التصنيفات ===");
for (const cat of Object.keys(HISTORY_CATEGORIES) as HistoryCategory[]) {
  const count = ISLAMIC_HISTORY_ITEMS.filter((i) => i.category === cat).length;
  assert(count >= 3, `${HISTORY_CATEGORIES[cat]}: ${count} عناصر`);
}

console.log("\n=== عناصر مميزة ===");
const featured = ISLAMIC_HISTORY_ITEMS.filter((i) => i.featured);
const startHere = ISLAMIC_HISTORY_ITEMS.filter((i) => i.startHere);
assert(featured.length >= 8, `أحداث مفصلية ≥8 (${featured.length})`);
assert(startHere.length >= 5, `ابدأ من هنا ≥5 (${startHere.length})`);
assert(
  ISLAMIC_HISTORY_ITEMS.some((i) => i.portalHref === "/seerah"),
  "بوابة السيرة النبوية موجودة في الخط الزمني",
);
assert(
  !ISLAMIC_HISTORY_ITEMS.some((i) => (i as { category: string }).category === "personalities"),
  "لا يوجد تصنيف شخصيات تاريخية",
);

console.log(`\n=== النتيجة: ${passed} نجاح، ${failed} فشل ===`);
if (failed > 0) process.exit(1);
