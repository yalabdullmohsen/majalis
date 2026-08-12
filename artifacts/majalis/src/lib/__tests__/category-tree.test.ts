/**
 * اختبارات شجرة التصنيفات + الحالات + فصل مشرف/مستخدم + اليتامى + البحث + العدادات.
 * تُشغَّل عبر: pnpm run test:category-tree
 */
import { buildCategoryTree, rollUpCounts, filterCategoryTreeByStatus, filterCategoryTreeDeep, flattenTreeIds, analyzeCategoryStructure, categoryMatchesQuery, type CategoryLike } from "../category-tree";
import {
  countCategoryStatuses,
  isPublicVisibleStatus,
  normalizeCategoryStatus,
  toWritableDbStatus,
} from "../category-status";

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ FAIL: ${label}`); failed++; }
}

type Row = CategoryLike & { name: string; slug?: string | null; status?: string | null };

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

console.log("\n=== تطبيع الحالات والظهور العام ===");
{
  assert(normalizeCategoryStatus("pending") === "pending_review", "pending → pending_review");
  assert(normalizeCategoryStatus("under_review") === "pending_review", "under_review → pending_review");
  assert(normalizeCategoryStatus("review_pending") === "pending_review", "review_pending → pending_review");
  assert(normalizeCategoryStatus("unpublished") === "hidden", "unpublished → hidden");
  assert(normalizeCategoryStatus(null) === "draft", "بلا حالة → مسودة");
  assert(isPublicVisibleStatus("published") === true, "المنشور ظاهر للمستخدم");
  assert(isPublicVisibleStatus("pending_review") === false, "قيد المراجعة مخفي عن المستخدم");
  assert(isPublicVisibleStatus("draft") === false, "المسودة مخفية عن المستخدم");
  assert(isPublicVisibleStatus("hidden") === false, "المخفي غير ظاهر للمستخدم");
  assert(toWritableDbStatus("pending_review", false) === "draft", "قبل migration: pending_review يُكتب كمسودة");
  assert(toWritableDbStatus("pending_review", true) === "pending_review", "بعد migration: تُحفظ كما هي");
}

console.log("\n=== المشرف يرى كل الحالات — المستخدم لا يرى غير المنشور ===");
{
  const flat: Row[] = [
    { id: "p", parent_id: null, sort_order: 0, name: "منشور", slug: "p", status: "published" },
    { id: "d", parent_id: null, sort_order: 1, name: "مسودة سرية", slug: "d", status: "draft" },
    { id: "r", parent_id: "p", sort_order: 0, name: "قيد مراجعة", slug: "r", status: "pending_review" },
    { id: "h", parent_id: null, sort_order: 2, name: "مخفي", slug: "h", status: "hidden" },
  ];
  const adminTree = buildCategoryTree(flat);
  const adminIds = flattenTreeIds(adminTree);
  assert(adminIds.length === 4, "المشرف يرى 4 عناصر بجميع الحالات");
  assert(adminIds.includes("r"), "العنصر قيد المراجعة يظهر في لوحة الإدارة");

  const publicFlat = flat.filter((c) => isPublicVisibleStatus(c.status));
  const publicTree = buildCategoryTree(publicFlat);
  const publicIds = flattenTreeIds(publicTree);
  assert(publicIds.length === 1 && publicIds[0] === "p", "المستخدم يرى المنشور فقط");
  assert(!publicIds.includes("d") && !publicIds.includes("r"), "المستخدم لا يرى مسودة ولا مراجعة");
}

console.log("\n=== الشجرة لا تفقد الفروع عند إخفاء الأب (عرض مشرف) ===");
{
  const flat: Row[] = [
    { id: "parent", parent_id: null, sort_order: 0, name: "أب مخفي", status: "hidden" },
    { id: "child", parent_id: "parent", sort_order: 0, name: "فرع منشور", status: "published" },
  ];
  const tree = buildCategoryTree(flat);
  assert(tree.length === 1 && tree[0].children.length === 1, "الفرع يبقى تحت الأب المخفي للمشرف");
  assert(flattenTreeIds(tree).includes("child"), "الفرع ظاهر في الشجرة الإدارية");
}

console.log("\n=== العناصر orphan تظهر في قائمة المعالجة ===");
{
  const flat: Row[] = [
    { id: "o1", parent_id: "missing", sort_order: 0, name: "يتيم", slug: "orphan-1", status: "draft" },
    { id: "ok", parent_id: null, sort_order: 0, name: "سليم", slug: "ok", status: "published" },
  ];
  const issues = analyzeCategoryStructure(flat);
  assert(issues.some((i) => i.kind === "orphan" && i.categoryId === "o1"), "يتيم في قائمة المعالجة");
  assert(issues.some((i) => i.kind === "missing_parent" && i.categoryId === "o1"), "أب مفقود مُبلَّغ");
}

console.log("\n=== البحث يعثر على عنصر غير منشور ===");
{
  const flat: Row[] = [
    { id: "pub", parent_id: null, sort_order: 0, name: "عقيدة منشورة", slug: "aqeedah", status: "published" },
    { id: "dr", parent_id: null, sort_order: 1, name: "مسودة فقه خفية", slug: "fiqh-draft", status: "draft" },
  ];
  const tree = buildCategoryTree(flat);
  const found = filterCategoryTreeDeep(tree, "فقه");
  assert(found.some((n) => n.id === "dr"), "البحث يجد المسودة بالاسم");
  const bySlug = filterCategoryTreeDeep(tree, "fiqh-draft");
  assert(bySlug.some((n) => n.id === "dr"), "البحث يجد المسودة بالـ slug");
  const byStatus = filterCategoryTreeDeep(tree, "draft");
  assert(byStatus.some((n) => n.id === "dr"), "البحث يجد بالحالة");
  assert(categoryMatchesQuery(flat[1], "dr"), "مطابقة بالمعرّف");
}

console.log("\n=== العدادات تطابق قاعدة البيانات (القائمة المسطحة) ===");
{
  const flat: Row[] = [
    { id: "1", parent_id: null, sort_order: 0, name: "a", status: "published" },
    { id: "2", parent_id: null, sort_order: 1, name: "b", status: "draft" },
    { id: "3", parent_id: null, sort_order: 2, name: "c", status: "pending" },
    { id: "4", parent_id: null, sort_order: 3, name: "d", status: "hidden" },
    { id: "5", parent_id: null, sort_order: 4, name: "e", status: "rejected" },
    { id: "6", parent_id: null, sort_order: 5, name: "f", status: "archived" },
    { id: "7", parent_id: null, sort_order: 6, name: "g", status: null },
  ];
  const counts = countCategoryStatuses(flat);
  assert(counts.total === 7, "الإجمالي 7");
  assert(counts.published === 1, "منشور 1");
  assert(counts.draft === 2, "مسودتان (بما فيها بلا حالة)");
  assert(counts.pending_review === 1, "قيد مراجعة 1");
  assert(counts.hidden === 1 && counts.rejected === 1 && counts.archived === 1, "مخفي/مرفوض/مؤرشف");
  assert(counts.publicVisible === 1, "ظاهر للمستخدم 1");
  assert(counts.unpublished === 6, "غير منشور 6");
  assert(counts.missingStatus === 1, "بلا حالة 1");
}

console.log("\n=== فلتر الحالة يحافظ على الأسلاف عند تطابق الفرع ===");
{
  const flat: Row[] = [
    { id: "root", parent_id: null, sort_order: 0, name: "جذر", status: "draft" },
    { id: "leaf", parent_id: "root", sort_order: 0, name: "ورقة", status: "pending_review" },
  ];
  const tree = buildCategoryTree(flat);
  const filtered = filterCategoryTreeByStatus(tree, "pending_review");
  assert(filtered.length === 1 && filtered[0].id === "root", "الأب يبقى للسياق");
  assert(filtered[0].children[0]?.id === "leaf", "الفرع المطابق ظاهر");
}

console.log("\n=== أول وآخر عنصر قابلان للوصول + أداء 360+ ===");
{
  const flat: Row[] = [];
  for (let i = 0; i < 360; i++) {
    flat.push({
      id: `id-${i}`,
      parent_id: i === 0 ? null : i % 17 === 0 ? null : `id-${Math.floor(i / 2)}`,
      sort_order: i,
      name: `تصنيف ${i}`,
      slug: `cat-${i}`,
      status: i % 5 === 0 ? "published" : i % 5 === 1 ? "draft" : i % 5 === 2 ? "pending_review" : i % 5 === 3 ? "hidden" : "archived",
    });
  }
  // أصلح علاقات parent لتكون ضمن المجموعة فقط
  const ids = new Set(flat.map((f) => f.id));
  for (const row of flat) {
    if (row.parent_id && !ids.has(row.parent_id)) row.parent_id = null;
  }
  const t0 = Date.now();
  const tree = buildCategoryTree(flat);
  const idsFlat = flattenTreeIds(tree);
  const issues = analyzeCategoryStructure(flat);
  const counts = countCategoryStatuses(flat);
  const filtered = filterCategoryTreeDeep(tree, "تصنيف 359");
  const elapsed = Date.now() - t0;
  assert(idsFlat.includes("id-0"), "أول عنصر قابل للوصول");
  assert(idsFlat.includes("id-359"), "آخر عنصر قابل للوصول");
  assert(idsFlat.length === 360, `كل الـ 360 في الشجرة — الفعلي ${idsFlat.length}`);
  assert(counts.total === 360, "العداد الإجمالي 360");
  assert(filtered.some((n) => flattenTreeIds([n]).includes("id-359")), "البحث يصل لآخر عنصر");
  assert(elapsed < 2000, `الأداء مستقر تحت ثانيتين عند 360 — ${elapsed}ms`);
  assert(Array.isArray(issues), "تحليل بنيوي يكتمل دون خطأ");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
