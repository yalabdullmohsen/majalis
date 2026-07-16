/**
 * اختبار وحدة لمنطق شجرة التصنيفات النقي (src/lib/category-tree.ts) —
 * بلا قاعدة بيانات، يغطي الحالات الحدّية التي تسبب فقدان بيانات صامتًا:
 * تصنيف بأب مفقود، عناصر بلا أبناء، ترتيب sort_order، والمجموع التراكمي
 * للعدادات عبر عدة مستويات (الأساس الذي تُبنى عليه عدادات "أبواب العلم").
 *
 * تُشغَّل عبر: npx tsx src/lib/__tests__/category-tree.test.ts
 */
import { buildCategoryTree, rollUpCounts, type CategoryLike } from "../category-tree";

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ FAIL: ${label}`); failed++; }
}

type Row = CategoryLike & { name: string };

console.log("\n=== buildCategoryTree — بنية أساسية ===");
{
  const flat: Row[] = [
    { id: "a", parent_id: null, sort_order: 2, name: "أ" },
    { id: "b", parent_id: null, sort_order: 1, name: "ب" },
    { id: "a1", parent_id: "a", sort_order: 1, name: "أ-فرعي" },
    { id: "a2", parent_id: "a", sort_order: 0, name: "أ-فرعي-2" },
  ];
  const tree = buildCategoryTree(flat);
  assert(tree.length === 2, "جذران فقط (لا أب لهما)");
  assert(tree[0].id === "b", "الترتيب حسب sort_order: ب (1) قبل أ (2)");
  assert(tree[1].id === "a", "أ ثانيًا");
  assert(tree[1].children.length === 2, "أ له فرعان");
  assert(tree[1].children[0].id === "a2", "الفرعان مرتّبان: أ2 (sort 0) قبل أ1 (sort 1)");
}

console.log("\n=== buildCategoryTree — أب مفقود لا يُفقِد العنصر صامتًا ===");
{
  const flat: Row[] = [
    { id: "orphan", parent_id: "ghost-does-not-exist", sort_order: 0, name: "يتيم" },
  ];
  const tree = buildCategoryTree(flat);
  assert(tree.length === 1, "العنصر ذو الأب المفقود يظهر كجذر بدل الاختفاء");
  assert(tree[0].id === "orphan", "نفس العنصر بعينه");
}

console.log("\n=== buildCategoryTree — قائمة فارغة ===");
{
  assert(buildCategoryTree([]).length === 0, "قائمة فارغة ← شجرة فارغة بلا خطأ");
}

console.log("\n=== buildCategoryTree — ثلاث مستويات ===");
{
  const flat: Row[] = [
    { id: "top", parent_id: null, sort_order: 0, name: "أعلى" },
    { id: "mid", parent_id: "top", sort_order: 0, name: "وسط" },
    { id: "leaf", parent_id: "mid", sort_order: 0, name: "ورقة" },
  ];
  const tree = buildCategoryTree(flat);
  assert(tree[0].children[0].children[0].id === "leaf", "التداخل الثلاثي محفوظ بالكامل");
}

console.log("\n=== rollUpCounts — تجميع العدادات عبر المستويات ===");
{
  type Counted = Row & { lessonCount: number; seriesCount: number };
  const flat: Counted[] = [
    { id: "top", parent_id: null, sort_order: 0, name: "أعلى", lessonCount: 1, seriesCount: 0 },
    { id: "mid", parent_id: "top", sort_order: 0, name: "وسط", lessonCount: 2, seriesCount: 1 },
    { id: "leaf1", parent_id: "mid", sort_order: 0, name: "ورقة1", lessonCount: 3, seriesCount: 0 },
    { id: "leaf2", parent_id: "mid", sort_order: 1, name: "ورقة2", lessonCount: 0, seriesCount: 1 },
  ];
  const tree = buildCategoryTree(flat);
  const totals = rollUpCounts(tree[0] as any);
  assert(totals.lessons === 6, `مجموع الدروس (1+2+3+0=6) صحيح — الفعلي: ${totals.lessons}`);
  assert(totals.series === 2, `مجموع السلاسل (0+1+0+1=2) صحيح — الفعلي: ${totals.series}`);
  assert((tree[0] as any).lessonCount === 6, "عدّاد الجذر نفسه مُحدَّث بالمجموع التراكمي (mutation في مكانها)");
  const mid = tree[0].children[0] as any;
  assert(mid.lessonCount === 5, `عدّاد "وسط" يشمل نفسه وفرعيه (2+3+0=5) — الفعلي: ${mid.lessonCount}`);
}

console.log("\n=== rollUpCounts — ورقة بلا فروع ===");
{
  type Counted = Row & { lessonCount: number; seriesCount: number };
  const flat: Counted[] = [{ id: "solo", parent_id: null, sort_order: 0, name: "منفرد", lessonCount: 4, seriesCount: 2 }];
  const tree = buildCategoryTree(flat);
  const totals = rollUpCounts(tree[0] as any);
  assert(totals.lessons === 4 && totals.series === 2, "عقدة بلا أبناء ترجع عدّادها المباشر كما هو");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
