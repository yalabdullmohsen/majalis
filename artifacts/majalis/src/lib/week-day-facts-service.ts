import { supabase } from "@/lib/supabase";

export type WeekDayCode = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
export type WeekDayInfoType = "recurring_virtue" | "historical_event" | "organizational_suggestion";

export type WeekDayReviewStatus =
  | "draft" | "needs_source" | "in_review" | "verified"
  | "needs_completion" | "published" | "rejected" | "archived";

export interface WeekDayFact {
  id: string;
  day_of_week: WeekDayCode;
  info_type: WeekDayInfoType;
  title: string;
  body: string;
  source_text: string | null;
  reference: string | null;
  grade: string | null;
  verified_by: string | null;
  review_status: WeekDayReviewStatus;
  editor_notes: string | null;
  sort_order: number;
}

export const WEEK_DAY_LABELS: Record<WeekDayCode, string> = {
  sat: "السبت", sun: "الأحد", mon: "الاثنين", tue: "الثلاثاء",
  wed: "الأربعاء", thu: "الخميس", fri: "الجمعة",
};

export const WEEK_DAY_REVIEW_STATUS_LABELS: Record<WeekDayReviewStatus, string> = {
  draft: "مسودة", needs_source: "يحتاج مصدرًا", in_review: "قيد المراجعة",
  verified: "موثّق (غير منشور بعد)", needs_completion: "يحتاج استكمالًا",
  published: "منشور للعامة", rejected: "مرفوض", archived: "مؤرشف",
};

const NO_MATERIAL_MESSAGE = "لا توجد حاليًا مادة شرعية موثقة خاصة بهذا اليوم.";

export function todayWeekDayCode(date: Date = new Date()): WeekDayCode {
  const codes: WeekDayCode[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return codes[date.getDay()];
}

/**
 * يعيد فقط الصفوف المنشورة فعليًا (review_status='published' — يفرضه RLS
 * أيضًا على مستوى القاعدة). لا يُخترع نص بديل عند غياب المادة — الفراغ حالة
 * مشروعة يجب عرضها كما هي.
 */
export async function fetchWeekDayFacts(day: WeekDayCode): Promise<WeekDayFact[]> {
  const { data, error } = await supabase
    .from("week_day_facts")
    .select("id, day_of_week, info_type, title, body, source_text, reference, grade, verified_by, sort_order")
    .eq("day_of_week", day)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as WeekDayFact[];
}

export function weekDayInfoTypeLabel(type: WeekDayInfoType): string {
  switch (type) {
    case "recurring_virtue": return "فضيلة شرعية متكررة";
    case "historical_event": return "حدث تاريخي بتاريخ اليوم";
    case "organizational_suggestion": return "اقتراح تنظيمي (غير شرعي)";
  }
}

export { NO_MATERIAL_MESSAGE };

// ── لوحة الإدارة: يتطلب صلاحية admin (سياسة week_day_facts_admin_all) ──────

export async function adminFetchAllWeekDayFacts(): Promise<WeekDayFact[]> {
  const { data, error } = await supabase
    .from("week_day_facts")
    .select("id, day_of_week, info_type, title, body, source_text, reference, grade, verified_by, review_status, editor_notes, sort_order")
    .order("day_of_week", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as WeekDayFact[];
}

export type WeekDayFactDraft = Omit<WeekDayFact, "id">;

export async function adminCreateWeekDayFact(draft: WeekDayFactDraft) {
  return supabase.from("week_day_facts").insert(draft).select().single();
}

export async function adminUpdateWeekDayFact(id: string, patch: Partial<WeekDayFactDraft>) {
  return supabase.from("week_day_facts").update(patch).eq("id", id).select().single();
}

/**
 * قاعدة النشر الإلزامية: لا يمكن الانتقال إلى "published" إلا من حالة
 * "verified" — يمنع تخطي المراجعة الشرعية بالخطأ من الواجهة (السياسة
 * لا تفرض هذا على مستوى القاعدة، فالتحقق هنا وحده هو الضمانة).
 */
export async function adminSetWeekDayReviewStatus(fact: WeekDayFact, next: WeekDayReviewStatus) {
  if (next === "published" && fact.review_status !== "verified") {
    throw new Error('لا يمكن النشر إلا من حالة "موثّق" — راجع المادة وانقلها إلى "موثّق" أولًا.');
  }
  return adminUpdateWeekDayFact(fact.id, { review_status: next });
}

export async function adminDeleteWeekDayFact(id: string) {
  return supabase.from("week_day_facts").delete().eq("id", id);
}
