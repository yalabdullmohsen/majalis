import { supabase } from "@/lib/supabase";

export type WeekDayCode = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
export type WeekDayInfoType = "recurring_virtue" | "historical_event" | "organizational_suggestion";

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
  sort_order: number;
}

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
