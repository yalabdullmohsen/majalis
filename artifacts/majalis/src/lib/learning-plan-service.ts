import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanLevel = "beginner" | "intermediate" | "advanced";

export const LEVEL_LABELS: Record<PlanLevel, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

export const INTEREST_OPTIONS = [
  { id: "aqeedah", label: "العقيدة", icon: "Landmark" },
  { id: "fiqh", label: "الفقه", icon: "ScrollText" },
  { id: "hadith", label: "الحديث", icon: "Repeat2" },
  { id: "quran", label: "القرآن والتفسير", icon: "BookOpen" },
  { id: "seerah", label: "السيرة", icon: "Moon" },
  { id: "akhlaq", label: "الأخلاق والتزكية", icon: "Gem" },
] as const;

export type InterestId = (typeof INTEREST_OPTIONS)[number]["id"];

export const DAILY_MINUTES_OPTIONS = [
  { value: 15, label: "١٥ دقيقة" },
  { value: 30, label: "٣٠ دقيقة" },
  { value: 60, label: "ساعة" },
  { value: 120, label: "ساعتان+" },
];

export type PlanItem = {
  type: "lesson" | "book" | "path";
  id: string;
  title: string;
  url: string;
  category: string;
  done: boolean;
};

export type LearningPlan = {
  id: string;
  user_id: string;
  level: PlanLevel;
  interests: InterestId[];
  daily_minutes: number;
  plan_items: PlanItem[];
  created_at: string;
  updated_at: string;
};

// ─── Category mapping ──────────────────────────────────────────────────────────

// Maps our interest IDs to Arabic category names used in DB
const INTEREST_TO_DB_CATEGORIES: Record<InterestId, string[]> = {
  aqeedah: ["عقيدة", "توحيد", "أصول الدين"],
  fiqh: ["فقه", "أحكام", "الفقه"],
  hadith: ["حديث", "سنة", "الحديث"],
  quran: ["قرآن", "تفسير", "تلاوة"],
  seerah: ["سيرة", "تاريخ إسلامي"],
  akhlaq: ["أخلاق", "تزكية", "رقائق"],
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getUserLearningPlan(userId: string): Promise<LearningPlan | null> {
  const { data } = await supabase
    .from("user_learning_plans")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as LearningPlan | null) ?? null;
}

export async function saveLearningPlan(
  userId: string,
  plan: { level: PlanLevel; interests: InterestId[]; daily_minutes: number; plan_items: PlanItem[] },
): Promise<LearningPlan> {
  const row = {
    user_id: userId,
    level: plan.level,
    interests: plan.interests,
    daily_minutes: plan.daily_minutes,
    plan_items: plan.plan_items,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("user_learning_plans")
    .upsert(row, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as LearningPlan;
}

export async function markPlanItemDone(
  userId: string,
  itemId: string,
  done: boolean,
): Promise<void> {
  const existing = await getUserLearningPlan(userId);
  if (!existing) return;
  const items = existing.plan_items.map((i) => (i.id === itemId ? { ...i, done } : i));
  await supabase
    .from("user_learning_plans")
    .update({ plan_items: items, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

// ─── Plan generation from existing DB content ──────────────────────────────────

export async function generatePlanItems(
  level: PlanLevel,
  interests: InterestId[],
  dailyMinutes: number,
): Promise<PlanItem[]> {
  const categories = interests.flatMap((i) => INTEREST_TO_DB_CATEGORIES[i]);

  // Fetch lessons matching interests
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, category, external_key")
    .eq("status", "approved")
    .in("category", categories)
    .limit(20);

  // Fetch books matching interests
  const { data: books } = await supabase
    .from("library_items")
    .select("id, title, category, type")
    .eq("status", "approved")
    .in("category", categories)
    .limit(15);

  const allItems: PlanItem[] = [];

  // Prioritise books for intermediate/advanced
  const bookWeight = level === "beginner" ? 0.3 : 0.5;
  const lessonItems: PlanItem[] = (lessons ?? []).map((l: any) => ({
    type: "lesson" as const,
    id: l.external_key || l.id,
    title: l.title,
    url: `/lessons/${l.external_key || l.id}`,
    category: l.category ?? "",
    done: false,
  }));
  const bookItems: PlanItem[] = (books ?? []).map((b: any) => ({
    type: "book" as const,
    id: b.id,
    title: b.title,
    url: `/library/${b.id}`,
    category: b.category ?? "",
    done: false,
  }));

  // How many total items based on available time (rough estimate)
  const totalItems = Math.min(30, Math.max(5, Math.round(dailyMinutes / 10) * 2));
  const bookCount = Math.round(totalItems * bookWeight);
  const lessonCount = totalItems - bookCount;

  allItems.push(...lessonItems.slice(0, lessonCount));
  allItems.push(...bookItems.slice(0, bookCount));

  // Fallback: if not enough items, add generic lessons
  if (allItems.length < 5) {
    const { data: fallback } = await supabase
      .from("lessons")
      .select("id, title, category, external_key")
      .eq("status", "approved")
      .limit(5);
    (fallback ?? []).forEach((l: any) => {
      if (!allItems.find((i) => i.id === (l.external_key || l.id))) {
        allItems.push({
          type: "lesson",
          id: l.external_key || l.id,
          title: l.title,
          url: `/lessons/${l.external_key || l.id}`,
          category: l.category ?? "",
          done: false,
        });
      }
    });
  }

  return allItems;
}
