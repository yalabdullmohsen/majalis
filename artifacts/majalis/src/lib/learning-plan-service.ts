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

// ─── Static fallback books ────────────────────────────────────────────────────

type StaticBook = { id: string; title: string; category: string; url: string; level: PlanLevel };

const STATIC_BOOKS_BY_INTEREST: Record<InterestId, StaticBook[]> = {
  aqeedah: [
    { id: "aqeedah-b1", title: "ثلاثة الأصول وأدلتها",            category: "عقيدة", url: "/learning-path/aqeedah", level: "beginner" },
    { id: "aqeedah-b2", title: "القواعد الأربع",                   category: "عقيدة", url: "/learning-path/aqeedah", level: "beginner" },
    { id: "aqeedah-b3", title: "كتاب التوحيد",                     category: "عقيدة", url: "/learning-path/aqeedah", level: "beginner" },
    { id: "aqeedah-b4", title: "العقيدة الواسطية",                 category: "عقيدة", url: "/learning-path/aqeedah", level: "intermediate" },
    { id: "aqeedah-b5", title: "القواعد المثلى في صفات الله",      category: "عقيدة", url: "/learning-path/aqeedah", level: "intermediate" },
    { id: "aqeedah-b6", title: "لمعة الاعتقاد",                    category: "عقيدة", url: "/learning-path/aqeedah", level: "intermediate" },
    { id: "aqeedah-b7", title: "العقيدة الطحاوية وشرحها",          category: "عقيدة", url: "/learning-path/aqeedah", level: "advanced" },
    { id: "aqeedah-b8", title: "شرح الأصول الستة",                 category: "عقيدة", url: "/learning-path/aqeedah", level: "advanced" },
  ],
  fiqh: [
    { id: "fiqh-b1", title: "زاد المستقنع في اختصار المقنع",      category: "فقه",   url: "/learning-path/fiqh",    level: "beginner" },
    { id: "fiqh-b2", title: "عمدة الفقه",                          category: "فقه",   url: "/learning-path/fiqh",    level: "beginner" },
    { id: "fiqh-b3", title: "آداب المشي إلى الصلاة",              category: "فقه",   url: "/learning-path/fiqh",    level: "beginner" },
    { id: "fiqh-b4", title: "الروض المربع شرح زاد المستقنع",       category: "فقه",   url: "/learning-path/fiqh",    level: "intermediate" },
    { id: "fiqh-b5", title: "المحرر في الفقه الحنبلي",             category: "فقه",   url: "/learning-path/fiqh",    level: "intermediate" },
    { id: "fiqh-b6", title: "المغني لابن قدامة",                   category: "فقه",   url: "/learning-path/fiqh",    level: "advanced" },
    { id: "fiqh-b7", title: "كشاف القناع عن متن الإقناع",          category: "فقه",   url: "/learning-path/fiqh",    level: "advanced" },
  ],
  hadith: [
    { id: "hadith-b1", title: "الأربعون النووية",                  category: "حديث",  url: "/learning-path/hadith",  level: "beginner" },
    { id: "hadith-b2", title: "عمدة الأحكام من كلام خير الأنام",  category: "حديث",  url: "/learning-path/hadith",  level: "beginner" },
    { id: "hadith-b3", title: "نخبة الفكر في مصطلح أهل الأثر",    category: "حديث",  url: "/learning-path/hadith",  level: "intermediate" },
    { id: "hadith-b4", title: "بلوغ المرام من أدلة الأحكام",       category: "حديث",  url: "/learning-path/hadith",  level: "intermediate" },
    { id: "hadith-b5", title: "الباعث الحثيث شرح اختصار علوم الحديث", category: "حديث", url: "/learning-path/hadith", level: "intermediate" },
    { id: "hadith-b6", title: "شرح نخبة الفكر لابن حجر",          category: "حديث",  url: "/learning-path/hadith",  level: "advanced" },
    { id: "hadith-b7", title: "صحيح البخاري — دراسة وتحليل",      category: "حديث",  url: "/learning-path/hadith",  level: "advanced" },
  ],
  quran: [
    { id: "tafsir-b1", title: "تيسير الكريم الرحمن — تفسير السعدي",  category: "تفسير", url: "/learning-path/tafsir", level: "beginner" },
    { id: "tafsir-b2", title: "أيسر التفاسير لأبي بكر الجزائري",     category: "تفسير", url: "/learning-path/tafsir", level: "beginner" },
    { id: "tafsir-b3", title: "مقدمة في أصول التفسير لابن تيمية",    category: "تفسير", url: "/learning-path/tafsir", level: "intermediate" },
    { id: "tafsir-b4", title: "تفسير ابن كثير (المختصر)",            category: "تفسير", url: "/learning-path/tafsir", level: "intermediate" },
    { id: "tafsir-b5", title: "الإتقان في علوم القرآن للسيوطي",      category: "تفسير", url: "/learning-path/tafsir", level: "advanced" },
    { id: "tafsir-b6", title: "التحرير والتنوير لابن عاشور",         category: "تفسير", url: "/learning-path/tafsir", level: "advanced" },
  ],
  seerah: [
    { id: "seerah-b1", title: "الرحيق المختوم للمباركفوري",          category: "سيرة",  url: "/learning-path/seerah", level: "beginner" },
    { id: "seerah-b2", title: "مختصر سيرة الرسول ﷺ",               category: "سيرة",  url: "/learning-path/seerah", level: "beginner" },
    { id: "seerah-b3", title: "فقه السيرة النبوية للغزالي",          category: "سيرة",  url: "/learning-path/seerah", level: "intermediate" },
    { id: "seerah-b4", title: "السيرة النبوية لابن هشام",            category: "سيرة",  url: "/learning-path/seerah", level: "intermediate" },
    { id: "seerah-b5", title: "السيرة النبوية الصحيحة للعمري",       category: "سيرة",  url: "/learning-path/seerah", level: "advanced" },
    { id: "seerah-b6", title: "زاد المعاد في هدي خير العباد لابن القيم", category: "سيرة", url: "/learning-path/seerah", level: "advanced" },
  ],
  akhlaq: [
    { id: "tazkiyah-b1", title: "رياض الصالحين للنووي",             category: "أخلاق", url: "/learning-path/tazkiyah", level: "beginner" },
    { id: "tazkiyah-b2", title: "كتاب الأذكار للنووي",              category: "أخلاق", url: "/learning-path/tazkiyah", level: "beginner" },
    { id: "tazkiyah-b3", title: "تزكية النفوس لأحمد فريد",          category: "أخلاق", url: "/learning-path/tazkiyah", level: "intermediate" },
    { id: "tazkiyah-b4", title: "مدارج السالكين لابن القيم",        category: "أخلاق", url: "/learning-path/tazkiyah", level: "intermediate" },
    { id: "tazkiyah-b5", title: "إحياء علوم الدين للغزالي (مختصر)", category: "أخلاق", url: "/learning-path/tazkiyah", level: "intermediate" },
    { id: "tazkiyah-b6", title: "طريق الهجرتين وباب السعادتين",     category: "أخلاق", url: "/learning-path/tazkiyah", level: "advanced" },
    { id: "tazkiyah-b7", title: "الفوائد لابن القيم",               category: "أخلاق", url: "/learning-path/tazkiyah", level: "advanced" },
  ],
};

function getStaticFallbackItems(
  level: PlanLevel,
  interests: InterestId[],
  bookCount: number,
  lessonCount: number,
  existingIds: Set<string>,
): PlanItem[] {
  // Include current level and one step down so there's always content
  const allowedLevels: PlanLevel[] =
    level === "beginner" ? ["beginner"]
    : level === "intermediate" ? ["beginner", "intermediate"]
    : ["beginner", "intermediate", "advanced"];

  const staticBooks: PlanItem[] = interests.flatMap((interest) =>
    (STATIC_BOOKS_BY_INTEREST[interest] ?? [])
      .filter((b) => allowedLevels.includes(b.level) && !existingIds.has(b.id))
      .map((b): PlanItem => ({
        type: "book",
        id: b.id,
        title: b.title,
        url: b.url,
        category: b.category,
        done: false,
      }))
  );

  // Deduplicate (same book might appear via multiple interests)
  const seen = new Set<string>();
  const deduped = staticBooks.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });

  // For the lesson slots just point to the science landing page as a "path" item
  const pathItems: PlanItem[] = interests.map((interest) => {
    const scienceSlug =
      interest === "quran" ? "tafsir"
      : interest === "akhlaq" ? "tazkiyah"
      : interest;
    const labels: Record<InterestId, string> = {
      aqeedah: "مسار العقيدة",
      fiqh: "مسار الفقه",
      hadith: "مسار الحديث",
      quran: "مسار التفسير",
      seerah: "مسار السيرة",
      akhlaq: "مسار التزكية",
    };
    return {
      type: "path" as const,
      id: `path-${scienceSlug}`,
      title: labels[interest],
      url: `/learning-path/${scienceSlug}`,
      category: "",
      done: false,
    };
  }).filter((p) => !existingIds.has(p.id));

  return [
    ...deduped.slice(0, bookCount),
    ...pathItems.slice(0, lessonCount),
  ];
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

  // Fallback: if not enough items, fill with static books + path links
  if (allItems.length < 5) {
    const existingIds = new Set(allItems.map((i) => i.id));
    const remaining = totalItems - allItems.length;
    const remainingBooks = Math.max(0, bookCount - bookItems.slice(0, bookCount).length);
    const remainingLessons = Math.max(0, remaining - remainingBooks);
    const staticItems = getStaticFallbackItems(
      level,
      interests,
      Math.max(remainingBooks, Math.ceil(remaining * (level === "beginner" ? 0.3 : 0.5))),
      Math.max(remainingLessons, interests.length),
      existingIds,
    );
    allItems.push(...staticItems);
  }

  return allItems;
}
