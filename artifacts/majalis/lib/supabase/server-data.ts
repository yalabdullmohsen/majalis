import { LESSONS_SEED } from "@/lib/lessons-seed";
import { DEMO_FAWAID, DEMO_QA, DEMO_QA_CATEGORIES, DEMO_SHEIKHS } from "@/lib/demo-content";
import { getLibraryCatalog, mergeLibraryWithCatalog, normalizeLibraryRow } from "@/lib/library-service";
import { filterMiraclesSeed } from "@/lib/miracles-seed";
import { mapLessonRow, sortKuwaitLessons, dedupeKuwaitLessons, splitKuwaitLessons } from "@/lib/kuwait-lessons";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { sheikhNameKey } from "@/lib/sheikh-name";
import {
  KUWAIT_SCHOLAR_REGISTRY,
  mergeRegistrySheikhs,
  resolveScholarProfile,
  lessonsForScholar,
} from "@/lib/kuwait-sheikhs-registry";
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
      sheikhsCount: KUWAIT_SCHOLAR_REGISTRY.length,
      libraryCount: getLibraryCatalog().length,
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
    sheikhsCount: Math.max(sheikhs.count ?? 0, KUWAIT_SCHOLAR_REGISTRY.length),
    libraryCount: library.count ?? getLibraryCatalog().length,
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

  const dbMapped = dedupeKuwaitLessons(
    data.map((row) => mapLessonRow({ ...row, source: "supabase" })),
  );
  const dbIds = new Set(dbMapped.map((l) => l.id));
  const supplemental = LESSONS_SEED.filter(
    (row) => !dbIds.has(String(row.external_key || row.id)),
  ).map((row) => mapLessonRow({ ...row, source: "seed" }));
  const merged = dedupeKuwaitLessons([...dbMapped, ...supplemental]);
  const sorted = sortKuwaitLessons(merged);
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

function lessonRouteId(row: { id?: string | number; external_key?: string | null }): string {
  return String(row.external_key || row.id || "");
}

export async function fetchAllLessonIds(): Promise<string[]> {
  const ids = new Set<string>();
  LESSONS_SEED.forEach((row) => {
    const routeId = lessonRouteId(row);
    if (routeId) ids.add(routeId);
  });

  if (!isSupabaseConfiguredServer()) {
    return [...ids];
  }

  const supabase = createStaticClient();
  const { data } = await supabase
    .from("lessons")
    .select("id, external_key")
    .eq("status", "approved");

  (data || []).forEach((row) => {
    const routeId = lessonRouteId(row);
    if (routeId) ids.add(routeId);
  });
  return [...ids];
}

export async function fetchSheikhsForServer() {
  if (!isSupabaseConfiguredServer()) {
    return mergeRegistrySheikhs(DEMO_SHEIKHS);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("sheikhs").select("*").order("name");
  if (error || !data?.length) return mergeRegistrySheikhs(DEMO_SHEIKHS);
  return mergeRegistrySheikhs(data);
}

export async function fetchSheikhByIdForServer(id: string) {
  const sheikhs = await fetchSheikhsForServer();
  let sheikh =
    sheikhs.find((row) => row.id === id || (row as { external_key?: string }).external_key === id) ?? null;

  if (!sheikh) {
    const profile = resolveScholarProfile(id);
    if (profile) sheikh = { ...profile, ijazah: profile.role };
  }

  if (!sheikh) return { sheikh: null, lessons: [] as KuwaitLessonRecord[] };

  const { active, archived } = await fetchLessonsForServer();
  const allLessons = [...active, ...archived];
  const profile = resolveScholarProfile(sheikh.name || id);
  const lessons = profile
    ? lessonsForScholar(profile, allLessons)
    : allLessons.filter(
        (lesson) => sheikhNameKey(lesson.sheikhName) === sheikhNameKey(sheikh!.name || ""),
      );

  return { sheikh, lessons };
}

export async function fetchAllSheikhIds(): Promise<string[]> {
  const ids = new Set<string>();
  KUWAIT_SCHOLAR_REGISTRY.forEach((row) => ids.add(String(row.id)));
  DEMO_SHEIKHS.forEach((row) => ids.add(String(row.id)));

  if (!isSupabaseConfiguredServer()) {
    return [...ids];
  }

  const supabase = createStaticClient();
  const { data, error } = await supabase.from("sheikhs").select("id, external_key").order("name");
  if (error || !data?.length) {
    return [...ids];
  }

  data.forEach((row) => {
    ids.add(String(row.id));
    if (row.external_key) ids.add(String(row.external_key));
  });
  return [...ids];
}

export async function fetchLibraryForServer() {
  if (!isSupabaseConfiguredServer()) {
    return getLibraryCatalog();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_items")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return getLibraryCatalog();
  return mergeLibraryWithCatalog(data.map((row) => normalizeLibraryRow(row)), "book");
}

export async function fetchLibraryBookByIdForServer(id: string) {
  const catalog = getLibraryCatalog().find((row) => row.id === id);
  if (!isSupabaseConfiguredServer()) return catalog ?? null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("library_items")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (data) return normalizeLibraryRow(data);
  return catalog ?? null;
}

export async function fetchAllLibraryIds(): Promise<string[]> {
  const ids = new Set<string>();
  getLibraryCatalog().forEach((row) => ids.add(String(row.id)));

  if (!isSupabaseConfiguredServer()) {
    return [...ids];
  }

  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("library_items")
    .select("id")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return [...ids];
  }

  data.forEach((row) => ids.add(String(row.id)));
  return [...ids];
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

export async function fetchSitemapEntries(): Promise<{
  lessonIds: string[];
  sheikhIds: string[];
  libraryIds: string[];
}> {
  try {
    const [lessonIds, sheikhIds, libraryIds] = await Promise.all([
      fetchAllLessonIds(),
      fetchAllSheikhIds(),
      fetchAllLibraryIds(),
    ]);

    return { lessonIds, sheikhIds, libraryIds };
  } catch (error) {
    console.error("[majalis:sitemap] Failed to fetch dynamic sitemap entries", error);
    return { lessonIds: [], sheikhIds: [], libraryIds: [] };
  }
}
