/**
 * منطق شجرة التصنيفات (self-referencing) — نقي، بلا Supabase، يُستخدَم من
 * طبقة القراءة العامة (learn-library-service.ts) ولوحة الإدارة
 * (CategoriesSection.tsx) معًا، بدل تكرار نفس منطق بناء الشجرة في مكانين
 * (وهو بالضبط ما يمنعه القسم الثاني عشر: "منع التكرار").
 */

export type CategoryLike = { id: string; parent_id: string | null; sort_order: number };
export type TreeNode<T> = T & { children: TreeNode<T>[] };

/**
 * يبني شجرة من قائمة مسطحة. عناصر بـ parent_id يشير لعنصر غير موجود ضمن
 * القائمة (تصنيف أب غير منشور مثلاً) تُعامَل كجذور — لا تُفقَد صامتة.
 */
export function buildCategoryTree<T extends CategoryLike>(flat: T[]): TreeNode<T>[] {
  const byId = new Map<string, TreeNode<T>>();
  for (const c of flat) byId.set(c.id, { ...c, children: [] });

  const roots: TreeNode<T>[] = [];
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  sortTreeRecursive(roots);
  return roots;
}

function sortTreeRecursive<T>(nodes: TreeNode<T & CategoryLike>[]): void {
  nodes.sort((a, b) => a.sort_order - b.sort_order);
  for (const n of nodes) sortTreeRecursive(n.children as TreeNode<T & CategoryLike>[]);
}

/**
 * يحسب مجموع تراكمي (دروس/سلاسل أو أي عدّاد آخر) لكل عقدة من عدّادها
 * المباشر + كل عدّادات فروعها، ويُعدِّل الشجرة في مكانها (mutation) عائدًا
 * بمجموع الجذر — يُستخدَم لعرض "١٢ درسًا" على تصنيف أب رغم أن الدروس فعليًا
 * موزّعة على تصنيفاته الفرعية.
 */
export function rollUpCounts<T extends { lessonCount: number; seriesCount: number; children: any[] }>(
  node: T,
): { lessons: number; series: number } {
  let lessons = node.lessonCount;
  let series = node.seriesCount;
  for (const child of node.children) {
    const sub = rollUpCounts(child);
    lessons += sub.lessons;
    series += sub.series;
  }
  node.lessonCount = lessons;
  node.seriesCount = series;
  return { lessons, series };
}
