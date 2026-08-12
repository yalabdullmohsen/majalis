/**
 * منطق شجرة التصنيفات (self-referencing) — نقي، بلا Supabase.
 */
import {
  normalizeCategoryStatus,
  type CategoryStatus,
} from "./category-status";

export type CategoryLike = {
  id: string;
  parent_id: string | null;
  sort_order: number;
  slug?: string | null;
  name?: string | null;
  status?: string | null;
};

export type TreeNode<T> = T & { children: TreeNode<T>[] };

/**
 * يبني شجرة من قائمة مسطحة. عناصر بـ parent_id يشير لعنصر غير موجود ضمن
 * القائمة تُعامَل كجذور — لا تُفقَد صامتة.
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

/** يبحث في الاسم/العنوان/slug/المعرّف/اسم الأب/الحالة عبر الشجرة كاملة */
export function categoryMatchesQuery<T extends CategoryLike & { name?: string | null; slug?: string | null; status?: string | null }>(
  node: T,
  query: string,
  parentName?: string | null,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    node.name ?? "",
    node.slug ?? "",
    node.id,
    node.status ?? "",
    parentName ?? "",
    normalizeCategoryStatus(node.status),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

/** تصفية شجرة مع الإبقاء على الأسلاف إن طابق فرع */
export function filterCategoryTreeDeep<T extends CategoryLike & { name?: string | null; slug?: string | null; status?: string | null }>(
  nodes: TreeNode<T>[],
  query: string,
  parentName: string | null = null,
): TreeNode<T>[] {
  if (!query.trim()) return nodes;
  const out: TreeNode<T>[] = [];
  for (const node of nodes) {
    const kids = filterCategoryTreeDeep(node.children, query, node.name ?? null);
    const selfMatch = categoryMatchesQuery(node, query, parentName);
    if (selfMatch || kids.length > 0) {
      out.push({ ...node, children: kids.length ? kids : selfMatch ? node.children : [] });
    }
  }
  return out;
}

export function filterCategoryTreeByStatus<T extends CategoryLike & { status?: string | null }>(
  nodes: TreeNode<T>[],
  status: CategoryStatus | "all",
): TreeNode<T>[] {
  if (status === "all") return nodes;
  const out: TreeNode<T>[] = [];
  for (const node of nodes) {
    const kids = filterCategoryTreeByStatus(node.children, status);
    const match = normalizeCategoryStatus(node.status) === status;
    if (match || kids.length > 0) {
      out.push({
        ...node,
        children: match && kids.length === 0 ? node.children : kids,
      });
    }
  }
  return out;
}

export type StructuralIssueKind =
  | "missing_parent"
  | "hidden_parent"
  | "cycle"
  | "duplicate_slug"
  | "empty_slug"
  | "null_sort"
  | "duplicate_sort"
  | "missing_name"
  | "orphan";

export type StructuralIssue<T extends CategoryLike = CategoryLike> = {
  kind: StructuralIssueKind;
  categoryId: string;
  category: T;
  message: string;
  suggestedAction: string;
};

/** كشف مشاكل بنيوية دون حذف أي عنصر */
export function analyzeCategoryStructure<T extends CategoryLike & { name?: string | null; slug?: string | null; status?: string | null }>(
  flat: T[],
): StructuralIssue<T>[] {
  const issues: StructuralIssue<T>[] = [];
  const byId = new Map(flat.map((c) => [c.id, c]));
  const slugCounts = new Map<string, string[]>();

  for (const c of flat) {
    const slug = (c.slug ?? "").trim();
    if (!slug) {
      issues.push({
        kind: "empty_slug",
        categoryId: c.id,
        category: c,
        message: "المعرّف (slug) فارغ",
        suggestedAction: "توليد slug من الاسم ثم الحفظ",
      });
    } else {
      const list = slugCounts.get(slug) ?? [];
      list.push(c.id);
      slugCounts.set(slug, list);
    }

    if (!(c.name ?? "").trim()) {
      issues.push({
        kind: "missing_name",
        categoryId: c.id,
        category: c,
        message: "الاسم فارغ",
        suggestedAction: "تعيين اسم واضح",
      });
    }

    if (c.sort_order == null || Number.isNaN(Number(c.sort_order))) {
      issues.push({
        kind: "null_sort",
        categoryId: c.id,
        category: c,
        message: "الترتيب (sort_order) غير صالح",
        suggestedAction: "تعيين رقم ترتيب",
      });
    }

    if (c.parent_id) {
      const parent = byId.get(c.parent_id);
      if (!parent) {
        issues.push({
          kind: "missing_parent",
          categoryId: c.id,
          category: c,
          message: `parent_id يشير إلى عنصر غير موجود (${c.parent_id})`,
          suggestedAction: "تعيين أب صالح أو جعله جذرًا (parent_id = null)",
        });
        issues.push({
          kind: "orphan",
          categoryId: c.id,
          category: c,
          message: "عنصر يتيم بلا أب ظاهر في المجموعة",
          suggestedAction: "إظهاره كجذر للمشرف وربطه بأب صحيح",
        });
      } else {
        const pst = normalizeCategoryStatus(parent.status);
        if (pst === "hidden" || pst === "archived" || pst === "rejected") {
          issues.push({
            kind: "hidden_parent",
            categoryId: c.id,
            category: c,
            message: `الأب «${parent.name ?? parent.id}» بحالة ${pst} — قد يختفي الفرع عن المستخدم`,
            suggestedAction: "نشر/إظهار الأب أو نقل الفرع",
          });
        }
      }

      // كشف الدورات
      const seen = new Set<string>();
      let cur: T | undefined = c;
      let steps = 0;
      while (cur?.parent_id && steps < flat.length + 2) {
        if (seen.has(cur.id)) {
          issues.push({
            kind: "cycle",
            categoryId: c.id,
            category: c,
            message: "حلقة في شجرة التصنيفات (parent_id دائري)",
            suggestedAction: "قطع الحلقة بتعيين parent_id = null لأحد العقد",
          });
          break;
        }
        seen.add(cur.id);
        cur = byId.get(cur.parent_id);
        steps += 1;
      }
    }
  }

  for (const [slug, ids] of slugCounts) {
    if (ids.length > 1) {
      for (const id of ids) {
        const cat = byId.get(id)!;
        issues.push({
          kind: "duplicate_slug",
          categoryId: id,
          category: cat,
          message: `slug مكرر: «${slug}» (${ids.length} عناصر)`,
          suggestedAction: "جعل كل slug فريدًا",
        });
      }
    }
  }

  // ترتيب مكرر ضمن نفس الأب
  const byParent = new Map<string, T[]>();
  for (const c of flat) {
    const key = c.parent_id ?? "__root__";
    const list = byParent.get(key) ?? [];
    list.push(c);
    byParent.set(key, list);
  }
  for (const siblings of byParent.values()) {
    const orderMap = new Map<number, T[]>();
    for (const s of siblings) {
      const o = Number(s.sort_order);
      if (Number.isNaN(o)) continue;
      const list = orderMap.get(o) ?? [];
      list.push(s);
      orderMap.set(o, list);
    }
    for (const [, list] of orderMap) {
      if (list.length > 1) {
        for (const s of list) {
          issues.push({
            kind: "duplicate_sort",
            categoryId: s.id,
            category: s,
            message: `ترتيب مكرر (${s.sort_order}) بين أشقاء`,
            suggestedAction: "إعادة ترقيم sort_order داخل نفس الأب",
          });
        }
      }
    }
  }

  return issues;
}

/** جمع كل المعرّفات في الشجرة (للاختبارات والعدادات) */
export function flattenTreeIds<T extends { id: string; children: TreeNode<T>[] }>(nodes: TreeNode<T>[]): string[] {
  const ids: string[] = [];
  const walk = (list: TreeNode<T>[]) => {
    for (const n of list) {
      ids.push(n.id);
      walk(n.children);
    }
  };
  walk(nodes);
  return ids;
}
