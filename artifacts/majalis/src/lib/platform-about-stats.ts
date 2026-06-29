import { DEMO_FAWAID, DEMO_QA, DEMO_SHEIKHS } from "@/lib/demo-content";
import { getLibraryCatalog } from "@/lib/library-service";
import { LESSONS_SEED } from "@/lib/lessons-seed";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { getSupabaseClient } from "@/lib/supabase-bootstrap";

export type AboutPlatformStats = {
  lessonsCount: number;
  sheikhsCount: number;
  booksCount: number;
  fawaidCount: number;
  qaCount: number;
  quranCirclesCount: number;
  mutoonCount: number;
  usersCount: number;
};

function isQuranCircle(row: { category?: string | null; title?: string | null; keywords?: string[] | null }) {
  const hay = `${row.category ?? ""} ${row.title ?? ""} ${(row.keywords ?? []).join(" ")}`;
  return /قرآن|قران|حلقة|تحفيظ|تلاو/i.test(hay);
}

function isMutoonItem(row: { title?: string | null; type?: string | null; category?: string | null }) {
  const hay = `${row.title ?? ""} ${row.type ?? ""} ${row.category ?? ""}`;
  return /متن|منظوم|أرجوز|الألفية|نونية|بردة|آجروم/i.test(hay) || row.type === "متن";
}

function seedFallbackStats(): AboutPlatformStats {
  const catalog = getLibraryCatalog();
  return {
    lessonsCount: LESSONS_SEED.filter((l) => l.status === "approved").length,
    sheikhsCount: DEMO_SHEIKHS.length,
    booksCount: catalog.length,
    fawaidCount: DEMO_FAWAID.length,
    qaCount: DEMO_QA.length,
    quranCirclesCount: LESSONS_SEED.filter((l) => l.status === "approved" && isQuranCircle(l)).length,
    mutoonCount: catalog.filter(isMutoonItem).length,
    usersCount: 0,
  };
}

export async function fetchAboutPlatformStats(): Promise<AboutPlatformStats> {
  if (!isSupabaseConfigured()) {
    return seedFallbackStats();
  }

  const supabase = getSupabaseClient();
  const fallback = seedFallbackStats();

  try {
    const [lessons, sheikhs, library, qa, fawaid, users, quranLessons, mutoonItems] = await Promise.all([
      supabase.from("lessons").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("sheikhs").select("*", { count: "exact", head: true }),
      supabase.from("library_items").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("qa_questions").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("fawaid").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .or("category.ilike.%قرآن%,category.ilike.%قران%,title.ilike.%حلقة%"),
      supabase
        .from("library_items")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .or("type.eq.متن,title.ilike.%متن%,title.ilike.%منظوم%,title.ilike.%أرجوز%"),
    ]);

    return {
      lessonsCount: lessons.count ?? fallback.lessonsCount,
      sheikhsCount: sheikhs.count ?? fallback.sheikhsCount,
      booksCount: library.count ?? fallback.booksCount,
      fawaidCount: fawaid.count ?? fallback.fawaidCount,
      qaCount: qa.count ?? fallback.qaCount,
      quranCirclesCount: quranLessons.count ?? fallback.quranCirclesCount,
      mutoonCount: mutoonItems.count ?? fallback.mutoonCount,
      usersCount: users.count ?? fallback.usersCount,
    };
  } catch {
    return fallback;
  }
}
