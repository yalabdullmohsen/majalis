import { supabase } from "@/lib/supabase";

export type ArbaeenReviewStatus = "draft" | "in_review" | "verified" | "published" | "rejected";

export interface ArbaeenHadith {
  id: string;
  order_number: number | null;
  title: string;
  hadith_text: string;
  source: string;
  hadith_number: string | null;
  grade: string | null;
  verified_by: string | null;
  review_status: ArbaeenReviewStatus;
  editor_notes: string | null;
}

export const ARBAEEN_REVIEW_STATUS_LABELS: Record<ArbaeenReviewStatus, string> = {
  draft: "مسودة",
  in_review: "قيد المراجعة",
  verified: "موثّق (غير منشور بعد)",
  published: "منشور للعامة",
  rejected: "مرفوض",
};

/**
 * يعيد فقط الصفوف المنشورة فعليًا (review_status='published' — يفرضه RLS
 * أيضًا على مستوى القاعدة). المجموعة قيد الاكتمال (17 من 40 حاليًا)، فعدد
 * النتائج المتوقع أقل من 40 حتى تكتمل المراجعة العلمية والبحث.
 */
export async function fetchPublishedArbaeenLove(): Promise<ArbaeenHadith[]> {
  const { data, error } = await supabase
    .from("arbaeen_love_of_allah")
    .select("id, order_number, title, hadith_text, source, hadith_number, grade, verified_by, review_status, editor_notes")
    .eq("review_status", "published")
    .order("order_number", { ascending: true });
  if (error || !data) return [];
  return data as ArbaeenHadith[];
}

// ── لوحة الإدارة: يتطلب صلاحية admin (سياسة arbaeen_love_admin_all) ────────

export async function adminFetchAllArbaeenLove(): Promise<ArbaeenHadith[]> {
  const { data, error } = await supabase
    .from("arbaeen_love_of_allah")
    .select("id, order_number, title, hadith_text, source, hadith_number, grade, verified_by, review_status, editor_notes")
    .order("order_number", { ascending: true });
  if (error || !data) return [];
  return data as ArbaeenHadith[];
}

export type ArbaeenHadithDraft = Omit<ArbaeenHadith, "id">;

export async function adminCreateArbaeenLove(draft: ArbaeenHadithDraft) {
  return supabase.from("arbaeen_love_of_allah").insert(draft).select().single();
}

export async function adminUpdateArbaeenLove(id: string, patch: Partial<ArbaeenHadithDraft>) {
  return supabase.from("arbaeen_love_of_allah").update(patch).eq("id", id).select().single();
}

/**
 * قاعدة النشر الإلزامية: لا يمكن الانتقال إلى "published" إلا من حالة
 * "verified" — يمنع نشر حديث لم يراجعه عالِم شرعي بعد بالخطأ من الواجهة.
 */
export async function adminSetArbaeenReviewStatus(item: ArbaeenHadith, next: ArbaeenReviewStatus) {
  if (next === "published" && item.review_status !== "verified") {
    throw new Error('لا يمكن النشر إلا من حالة "موثّق" — راجع الحديث ودرجته وانقله إلى "موثّق" أولًا.');
  }
  return adminUpdateArbaeenLove(item.id, { review_status: next });
}

export async function adminDeleteArbaeenLove(id: string) {
  return supabase.from("arbaeen_love_of_allah").delete().eq("id", id);
}
