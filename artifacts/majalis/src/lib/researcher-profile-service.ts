import { supabase } from "@/lib/supabase";

export type ResearcherProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  institution: string | null;
  specialization: string | null;
  research_interests: string[];
  publications: string[];
  is_public: boolean;
  updated_at: string;
};

export async function getResearcherProfile(userId: string): Promise<ResearcherProfile | null> {
  const { data } = await supabase
    .from("researcher_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as ResearcherProfile | null) ?? null;
}

export async function saveResearcherProfile(
  userId: string,
  profile: Partial<Omit<ResearcherProfile, "id" | "user_id" | "updated_at">>,
): Promise<void> {
  await supabase.from("researcher_profiles").upsert(
    {
      user_id: userId,
      ...profile,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export const SPECIALIZATION_OPTIONS = [
  "الفقه وأصوله",
  "الحديث وعلومه",
  "التفسير وعلوم القرآن",
  "العقيدة والكلام",
  "السيرة والتاريخ الإسلامي",
  "اللغة العربية",
  "الفقه المقارن",
  "الاقتصاد الإسلامي",
  "الفقه الطبي",
  "الفقه المعاصر",
  "الدراسات الإسلامية المقارنة",
  "أخرى",
];

export const INTEREST_TAGS = [
  "الفقه الحنبلي",
  "الفقه الشافعي",
  "الفقه المالكي",
  "الفقه الحنفي",
  "علم الرجال",
  "مصطلح الحديث",
  "التفسير الموضوعي",
  "الفقه الأسري",
  "مقاصد الشريعة",
  "أصول الفقه",
  "الحديث النبوي",
  "السيرة النبوية",
  "التاريخ الإسلامي",
  "الفتوى المعاصرة",
  "الفقه الميسر",
];
