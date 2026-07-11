import { supabase } from "./supabase";
import { isSupabaseConfigured } from "./supabase-config";
import { QURAN_CIRCLES_SEED } from "./quran-circles-seed";

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
  registration_url?: string | null;
  website_url?: string | null;
  governorate?: string | null;
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

function applyFilters(circles: QuranCircle[], filters: CircleFilters): QuranCircle[] {
  return circles.filter((c) => {
    if (filters.level && c.level !== filters.level) return false;
    if (filters.track && c.track !== filters.track) return false;
    if (filters.mode  && c.mode  !== filters.mode)  return false;
    if (filters.day   && !c.schedule_days?.includes(filters.day)) return false;
    return true;
  });
}

export async function getQuranCircles(filters: CircleFilters = {}): Promise<QuranCircle[]> {
  if (!isSupabaseConfigured()) {
    return applyFilters(QURAN_CIRCLES_SEED as QuranCircle[], filters);
  }

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
  if (error) {
    return applyFilters(QURAN_CIRCLES_SEED as QuranCircle[], filters);
  }

  const rows = (data ?? []) as QuranCircle[];
  return rows.length > 0 ? rows : applyFilters(QURAN_CIRCLES_SEED as QuranCircle[], filters);
}
