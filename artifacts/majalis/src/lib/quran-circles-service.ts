import { supabase } from "./supabase";

export interface QuranCircle {
  id: string;
  name: string;
  sheikh_name: string | null;
  level: "مبتدئ" | "متوسط" | "متقدم";
  track: "رجال" | "نساء" | "أطفال" | "عام";
  mode: "حضوري" | "عن بُعد" | "هجين";
  meeting_link: string | null;
  location: string | null;
  schedule_days: string[] | null;
  schedule_time: string | null;
  capacity: number | null;
  enrolled_count: number;
  description: string | null;
  cover_image: string | null;
  contact_info: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CircleFilters {
  level?: string;
  track?: string;
  mode?: string;
  day?: string;
}

export async function getQuranCircles(filters: CircleFilters = {}): Promise<QuranCircle[]> {
  let q = supabase
    .from("quran_circles")
    .select("*")
    .eq("is_active", true)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (filters.level) q = q.eq("level", filters.level);
  if (filters.track) q = q.eq("track", filters.track);
  if (filters.mode)  q = q.eq("mode",  filters.mode);
  if (filters.day)   q = q.contains("schedule_days", [filters.day]);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as QuranCircle[];
}
