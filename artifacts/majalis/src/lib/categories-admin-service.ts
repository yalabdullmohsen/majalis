/** طبقة إدارة شجرة التصنيفات (categories) — CRUD كامل بلا فلترة status. */
import { supabase } from "@/lib/supabase";

export type AdminCategory = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  status: "draft" | "published" | "archived";
};

export async function adminFetchCategories(): Promise<{ data: AdminCategory[] | null; error: { message: string } | null }> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, parent_id, slug, name, description, icon, sort_order, status")
    .order("sort_order");
  return { data: data as AdminCategory[] | null, error };
}

export async function adminUpsertCategory(row: Partial<AdminCategory>) {
  const { data, error } = await supabase.from("categories").upsert(row).select("*").single();
  return { data, error };
}

export async function adminDeleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return { error };
}

export async function adminSwapCategorySortOrder(a: { id: string; sort_order: number }, b: { id: string; sort_order: number }) {
  const { error: e1 } = await supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id);
  if (e1) return { error: e1 };
  const { error: e2 } = await supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id);
  return { error: e2 };
}

/**
 * تحقق نشر: لا يُسمح بترقية تصنيف إلى "منشور" إلا إذا كان له محتوى فعلي —
 * درس معتمد مباشر، أو سلسلة منشورة مباشرة، أو تصنيف فرعي منشور (بشكل متكرر
 * يحمل بدوره محتوى) — يمنع "أبوابًا فارغة" تمامًا كما يفرض ذلك القسم الثاني
 * من المتطلبات.
 */
export async function adminValidateCategoryForPublish(categoryId: string): Promise<{ ok: boolean; errors: string[] }> {
  const { count: lessonCount } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("status", "approved");
  if (lessonCount && lessonCount > 0) return { ok: true, errors: [] };

  const { count: seriesCount } = await supabase
    .from("lesson_series")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("status", "published");
  if (seriesCount && seriesCount > 0) return { ok: true, errors: [] };

  const { data: children } = await supabase.from("categories").select("id, status").eq("parent_id", categoryId);
  for (const child of children ?? []) {
    if ((child as any).status === "published") {
      const sub = await adminValidateCategoryForPublish((child as any).id);
      if (sub.ok) return { ok: true, errors: [] };
    }
  }

  return { ok: false, errors: ["لا يوجد محتوى منشور تحت هذا التصنيف (لا درس معتمد، ولا سلسلة منشورة، ولا تصنيف فرعي منشور بمحتوى) — النشر ممنوع لتفادي باب فارغ"] };
}
