/**
 * طبقة إدارة شجرة التصنيفات (categories) —
 * المشرف يرى كل الحالات؛ لا فلتر published/approved مخفي.
 */
import { supabase } from "@/lib/supabase";
import {
  normalizeCategoryStatus,
  toWritableDbStatus,
  type CategoryStatus,
} from "@/lib/category-status";
import { analyzeCategoryStructure, type StructuralIssue } from "@/lib/category-tree";

export type AdminCategory = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  status: CategoryStatus;
  status_reason?: string | null;
  status_changed_at?: string | null;
  status_changed_by?: string | null;
};

export type CategoryAuditEntry = {
  id?: string;
  category_id: string;
  previous_status: string | null;
  new_status: string;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
};

const PAGE = 1000;

/** جلب كل الصفوف بلا استثناء حالة — مع صفحات حتى لا يُقطع عند حد Supabase */
export async function adminFetchCategories(): Promise<{
  data: AdminCategory[] | null;
  error: { message: string } | null;
  truncated: boolean;
}> {
  const all: AdminCategory[] = [];
  let from = 0;
  let truncated = false;

  for (;;) {
    const { data, error } = await supabase
      .from("categories")
      .select(
        "id, parent_id, slug, name, description, icon, sort_order, status, status_reason, status_changed_at, status_changed_by",
      )
      .order("sort_order")
      .order("name")
      .range(from, from + PAGE - 1);

    if (error) {
      // أعمدة التتبع قد لا تكون موجودة قبل migration — أعد المحاولة بالحقول الأساسية
      if (/status_reason|status_changed/i.test(error.message)) {
        const fallback = await adminFetchCategoriesLegacy();
        return fallback;
      }
      return { data: null, error: { message: error.message }, truncated: false };
    }

    const batch = ((data ?? []) as AdminCategory[]).map((row) => ({
      ...row,
      status: normalizeCategoryStatus(row.status),
    }));
    all.push(...batch);

    if (batch.length < PAGE) break;
    from += PAGE;
    if (from > 50_000) {
      truncated = true;
      break;
    }
  }

  return { data: all, error: null, truncated };
}

async function adminFetchCategoriesLegacy(): Promise<{
  data: AdminCategory[] | null;
  error: { message: string } | null;
  truncated: boolean;
}> {
  const all: AdminCategory[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("categories")
      .select("id, parent_id, slug, name, description, icon, sort_order, status")
      .order("sort_order")
      .range(from, from + PAGE - 1);
    if (error) return { data: null, error: { message: error.message }, truncated: false };
    const batch = ((data ?? []) as AdminCategory[]).map((row) => ({
      ...row,
      status: normalizeCategoryStatus(row.status),
    }));
    all.push(...batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  return { data: all, error: null, truncated: false };
}

let expandedSchemaCache: boolean | null = null;

async function detectExpandedSchema(): Promise<boolean> {
  if (expandedSchemaCache != null) return expandedSchemaCache;
  const { error } = await supabase
    .from("categories")
    .select("status_reason")
    .limit(1);
  expandedSchemaCache = !error;
  return expandedSchemaCache;
}

export async function adminUpsertCategory(row: Partial<AdminCategory>) {
  const expanded = await detectExpandedSchema();
  const payload: Record<string, unknown> = { ...row };
  if (row.status) {
    payload.status = toWritableDbStatus(normalizeCategoryStatus(row.status), expanded);
  }
  if (!expanded) {
    delete payload.status_reason;
    delete payload.status_changed_at;
    delete payload.status_changed_by;
  }
  const { data, error } = await supabase.from("categories").upsert(payload).select("*").single();
  return { data, error };
}

export async function adminDeleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return { error };
}

export async function adminSwapCategorySortOrder(
  a: { id: string; sort_order: number },
  b: { id: string; sort_order: number },
) {
  const { error: e1 } = await supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id);
  if (e1) return { error: e1 };
  const { error: e2 } = await supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id);
  return { error: e2 };
}

async function writeAudit(entry: Omit<CategoryAuditEntry, "id" | "changed_at"> & { changed_at?: string }) {
  const expanded = await detectExpandedSchema();
  if (!expanded) return;
  await supabase.from("category_status_audit").insert({
    category_id: entry.category_id,
    previous_status: entry.previous_status,
    new_status: entry.new_status,
    reason: entry.reason,
    changed_by: entry.changed_by,
    changed_at: entry.changed_at ?? new Date().toISOString(),
  });
}

export async function adminChangeCategoryStatus(opts: {
  category: AdminCategory;
  next: CategoryStatus;
  reason?: string | null;
  actorId?: string | null;
  cascadeAncestors?: boolean;
}): Promise<{ error: { message: string } | null }> {
  const { category, next, reason, actorId, cascadeAncestors } = opts;
  const expanded = await detectExpandedSchema();
  const writable = toWritableDbStatus(next, expanded);

  if (next === "published") {
    const check = await adminValidateCategoryForPublish(category.id);
    if (!check.ok) return { error: { message: check.errors.join(" — ") } };
  }

  const patch: Record<string, unknown> = {
    status: writable,
  };
  if (expanded) {
    patch.status_reason = reason ?? null;
    patch.status_changed_at = new Date().toISOString();
    patch.status_changed_by = actorId ?? null;
  }

  const { error } = await supabase.from("categories").update(patch).eq("id", category.id);
  if (error) return { error: { message: error.message } };

  await writeAudit({
    category_id: category.id,
    previous_status: category.status,
    new_status: next,
    reason: reason ?? null,
    changed_by: actorId ?? null,
  });

  if (cascadeAncestors && next === "published" && category.parent_id) {
    await adminCascadePublishAncestors(category.parent_id, actorId ?? null);
  }

  return { error: null };
}

/** ينشر الآباء المسودة فقط حتى يظهر الفرع المنشور في الشجرة العامة */
export async function adminCascadePublishAncestors(
  parentId: string,
  actorId: string | null,
): Promise<void> {
  const { data } = await supabase
    .from("categories")
    .select("id, parent_id, status, name, slug, description, icon, sort_order")
    .eq("id", parentId)
    .maybeSingle();
  if (!data) return;
  const st = normalizeCategoryStatus((data as AdminCategory).status);
  if (st === "draft" || st === "pending_review" || st === "hidden") {
    await adminChangeCategoryStatus({
      category: { ...(data as AdminCategory), status: st },
      next: "published",
      reason: "نشر تلقائي للأب لإظهار فرع منشور",
      actorId,
      cascadeAncestors: true,
    });
  }
}

export async function adminValidateCategoryForPublish(
  categoryId: string,
): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];

  const { data: cat } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .eq("id", categoryId)
    .maybeSingle();

  if (!cat) return { ok: false, errors: ["التصنيف غير موجود"] };
  if (!(cat as { name?: string }).name?.trim()) errors.push("الاسم فارغ");
  if (!(cat as { slug?: string }).slug?.trim()) errors.push("الـ slug فارغ");

  const { count: lessonCount } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("status", "approved");
  if (lessonCount && lessonCount > 0) {
    return { ok: errors.length === 0, errors };
  }

  const { count: seriesCount } = await supabase
    .from("lesson_series")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("status", "published");
  if (seriesCount && seriesCount > 0) {
    return { ok: errors.length === 0, errors };
  }

  const { data: children } = await supabase
    .from("categories")
    .select("id, status")
    .eq("parent_id", categoryId);
  for (const child of children ?? []) {
    if (normalizeCategoryStatus((child as { status: string }).status) === "published") {
      const sub = await adminValidateCategoryForPublish((child as { id: string }).id);
      if (sub.ok) return { ok: errors.length === 0, errors };
    }
  }

  errors.push(
    "لا يوجد محتوى منشور تحت هذا التصنيف (لا درس معتمد، ولا سلسلة منشورة، ولا تصنيف فرعي منشور بمحتوى)",
  );
  return { ok: false, errors };
}

export type BulkPublishResult = {
  attempted: number;
  published: number;
  skipped: Array<{ id: string; name: string; reason: string }>;
};

export async function adminBulkPublishCategories(
  categories: AdminCategory[],
  actorId?: string | null,
): Promise<BulkPublishResult> {
  const result: BulkPublishResult = { attempted: categories.length, published: 0, skipped: [] };

  for (const cat of categories) {
    if (!cat.name?.trim() || !cat.slug?.trim()) {
      result.skipped.push({ id: cat.id, name: cat.name || cat.id, reason: "ناقص العنوان أو الـ slug" });
      continue;
    }
    if (cat.parent_id) {
      // الأب المفقود يُكتشف لاحقًا في التحليل البنيوي — لا نمنع هنا إن وُجد في القائمة
    }
    const check = await adminValidateCategoryForPublish(cat.id);
    if (!check.ok) {
      result.skipped.push({ id: cat.id, name: cat.name, reason: check.errors.join("؛ ") });
      continue;
    }
    const { error } = await adminChangeCategoryStatus({
      category: cat,
      next: "published",
      reason: "اعتماد ونشر جماعي",
      actorId: actorId ?? null,
      cascadeAncestors: true,
    });
    if (error) {
      result.skipped.push({ id: cat.id, name: cat.name, reason: error.message });
      continue;
    }
    result.published += 1;
  }

  return result;
}

export function adminAnalyzeCategories(flat: AdminCategory[]): StructuralIssue<AdminCategory>[] {
  return analyzeCategoryStructure(flat);
}

export async function adminFetchStatusAudit(categoryId: string): Promise<CategoryAuditEntry[]> {
  const expanded = await detectExpandedSchema();
  if (!expanded) return [];
  const { data } = await supabase
    .from("category_status_audit")
    .select("id, category_id, previous_status, new_status, reason, changed_by, changed_at")
    .eq("category_id", categoryId)
    .order("changed_at", { ascending: false })
    .limit(50);
  return (data as CategoryAuditEntry[]) ?? [];
}

/** إصلاح آمن لليتيم: جعله جذرًا (لا حذف) — تحديث جزئي دون مسح الحقول الأخرى */
export async function adminDetachOrphanParent(category: AdminCategory) {
  const expanded = await detectExpandedSchema();
  const patch: Record<string, unknown> = { parent_id: null };
  if (expanded) {
    patch.status_reason = "إصلاح يتيم: فصل عن أب مفقود";
    patch.status_changed_at = new Date().toISOString();
  }
  const { data, error } = await supabase.from("categories").update(patch).eq("id", category.id).select("*").single();
  if (!error) {
    await writeAudit({
      category_id: category.id,
      previous_status: category.status,
      new_status: category.status,
      reason: "إصلاح يتيم: فصل عن أب مفقود",
      changed_by: null,
    });
  }
  return { data, error };
}

/** توليد slug فريد بسيط عند الفراغ — تحديث جزئي */
export async function adminFixEmptySlug(category: AdminCategory) {
  const base = (category.name || "category")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `cat-${category.id.slice(0, 8)}`;
  const slug = `${base}-${category.id.slice(0, 6)}`;
  const { data, error } = await supabase.from("categories").update({ slug }).eq("id", category.id).select("*").single();
  return { data, error };
}
