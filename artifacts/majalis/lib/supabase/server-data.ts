import { LESSONS_SEED } from "@/lib/lessons-seed";
import { DEMO_FAWAID, DEMO_LIBRARY, DEMO_QA, DEMO_QA_CATEGORIES, DEMO_SHEIKHS } from "@/lib/demo-content";
import { filterMiraclesSeed } from "@/lib/miracles-seed";
import { mapLessonRow, sortKuwaitLessons, dedupeKuwaitLessons, splitKuwaitLessons } from "@/lib/kuwait-lessons";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { createClient, createStaticClient, isSupabaseConfiguredServer } from "./server";

const SHEIKH_EMBED = "sheikhs(id, name, city, photo_url)";

export type HomePlatformStats = {
  lessonsCount: number;
  sheikhsCount: number;
  libraryCount: number;
  qaCount: number;
  fawaidCount: number;
  miraclesCount: number;
};

export async function fetchHomePlatformStats(): Promise<HomePlatformStats> {
  if (!isSupabaseConfiguredServer()) {
    return {
      lessonsCount: LESSONS_SEED.length,
      sheikhsCount: DEMO_SHEIKHS.length,
      libraryCount: DEMO_LIBRARY.length,
      qaCount: DEMO_QA.length,
      fawaidCount: DEMO_FAWAID.length,
      miraclesCount: filterMiraclesSeed({}).length,
    };
  }

  const supabase = await createClient();
  const [lessons, sheikhs, library, qa, fawaid, miracles] = await Promise.all([
    supabase.from("lessons").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("sheikhs").select("*", { count: "exact", head: true }),
    supabase.from("library_items").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("qa_questions").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("fawaid").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("scientific_miracles").select("*", { count: "exact", head: true }).eq("status", "approved"),
  ]);

  return {
    lessonsCount: lessons.count ?? LESSONS_SEED.length,
    sheikhsCount: sheikhs.count ?? DEMO_SHEIKHS.length,
    libraryCount: library.count ?? DEMO_LIBRARY.length,
    qaCount: qa.count ?? DEMO_QA.length,
    fawaidCount: fawaid.count ?? DEMO_FAWAID.length,
    miraclesCount: miracles.count ?? filterMiraclesSeed({}).length,
  };
}

export async function fetchLessonsForServer(): Promise<{
  active: KuwaitLessonRecord[];
  archived: KuwaitLessonRecord[];
}> {
  if (!isSupabaseConfiguredServer()) {
    const lessons = dedupeKuwaitLessons(
      LESSONS_SEED.map((row) => mapLessonRow({ ...row, source: "seed" })),
    );
    const sorted = sortKuwaitLessons(lessons);
    return splitKuwaitLessons(sorted);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(`*, ${SHEIKH_EMBED}`)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    const lessons = dedupeKuwaitLessons(
      LESSONS_SEED.map((row) => mapLessonRow({ ...row, source: "seed" })),
    );
    const sorted = sortKuwaitLessons(lessons);
    return splitKuwaitLessons(sorted);
  }

  const mapped = dedupeKuwaitLessons(
    data.map((row) => mapLessonRow({ ...row, source: "supabase" })),
  );
  const sorted = sortKuwaitLessons(mapped);
  return splitKuwaitLessons(sorted);
}

export async function fetchLessonByIdForServer(id: string): Promise<KuwaitLessonRecord | null> {
  const { active, archived } = await fetchLessonsForServer();
  const found = [...active, ...archived].find((lesson) => lesson.id === id);
  if (found) return found;

  if (!isSupabaseConfiguredServer()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select(`*, ${SHEIKH_EMBED}`)
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  return data ? mapLessonRow({ ...data, source: "supabase" }) : null;
}

export async function fetchAllLessonIds(): Promise<string[]> {
  const ids = new Set<string>();
  LESSONS_SEED.forEach((row) => ids.add(String(row.id)));

  if (!isSupabaseConfiguredServer()) {
    return [...ids];
  }

  const supabase = createStaticClient();
  const { data } = await supabase
    .from("lessons")
    .select("id")
    .eq("status", "approved");

  (data || []).forEach((row) => ids.add(String(row.id)));
  return [...ids];
}

export async function fetchSheikhsForServer() {
  if (!isSupabaseConfiguredServer()) {
    return DEMO_SHEIKHS;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("sheikhs").select("*").order("name");
  if (error || !data?.length) return DEMO_SHEIKHS;
  return data;
}

export async function fetchSheikhByIdForServer(id: string) {
  const sheikhs = await fetchSheikhsForServer();
  const sheikh = sheikhs.find((row) => row.id === id) ?? null;

  if (!sheikh) return { sheikh: null, lessons: [] as KuwaitLessonRecord[] };

  const { active, archived } = await fetchLessonsForServer();
  const lessons = [...active, ...archived].filter(
    (lesson) => lesson.sheikhName === sheikh.name,
  );

  return { sheikh, lessons };
}

export async function fetchAllSheikhIds(): Promise<string[]> {
  const sheikhs = await fetchSheikhsForServer();
  return sheikhs.map((row) => String(row.id));
}

export async function fetchLibraryForServer() {
  if (!isSupabaseConfiguredServer()) {
    return DEMO_LIBRARY;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_items")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return DEMO_LIBRARY;
  return data;
}

export async function fetchAllLibraryIds(): Promise<string[]> {
  const items = await fetchLibraryForServer();
  return items.map((row) => String(row.id));
}

export async function fetchFawaidForServer() {
  if (!isSupabaseConfiguredServer()) {
    return DEMO_FAWAID;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fawaid")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return DEMO_FAWAID;
  return data;
}

export async function fetchQaForServer() {
  if (!isSupabaseConfiguredServer()) {
    return {
      categories: DEMO_QA_CATEGORIES.filter((c) => c.id !== "all"),
      questions: DEMO_QA,
    };
  }

  const supabase = await createClient();
  const [{ data: categories }, { data: questions }] = await Promise.all([
    supabase.from("qa_categories").select("*").order("sort_order"),
    supabase
      .from("qa_questions")
      .select("*, qa_categories(name, slug)")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
  ]);

  return {
    categories: categories?.length ? categories : DEMO_QA_CATEGORIES.filter((c) => c.id !== "all"),
    questions: questions?.length ? questions : DEMO_QA,
  };
}

export async function fetchMiraclesForServer() {
  if (!isSupabaseConfiguredServer()) {
    return filterMiraclesSeed({});
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scientific_miracles")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return filterMiraclesSeed({});
  return data;
}

export async function fetchSitemapEntries() {
  const [lessonIds, sheikhIds, libraryIds] = await Promise.all([
    fetchAllLessonIds(),
    fetchAllSheikhIds(),
    fetchAllLibraryIds(),
  ]);

  return { lessonIds, sheikhIds, libraryIds };
}
