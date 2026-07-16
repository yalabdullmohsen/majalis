/**
 * طبقة قراءة عامة لمكتبة "تعلّم" (شجرة التصنيفات + الدروس المُهيكَلة +
 * السلاسل) — كل الاستعلامات هنا تفترض RLS العام (status='published'/'approved'
 * فقط، أو is_admin()) كخط الدفاع الحقيقي، تمامًا كنمط learning-paths-service.ts.
 */
import { supabase } from "@/lib/supabase";
import { buildCategoryTree, rollUpCounts } from "@/lib/category-tree";

export type CategoryRow = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  status: "draft" | "published" | "archived";
};

export type CategoryWithCounts = CategoryRow & {
  children: CategoryWithCounts[];
  lessonCount: number; // مباشر + كل الفروع
  seriesCount: number; // مباشر + كل الفروع
};

export type LessonSummary = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  activity_type: string;
  session_count: number | null;
  sheikh_id: string | null;
};

export type SeriesSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: "beginner" | "intermediate" | "advanced";
  category_id: string | null;
  related_course_id: string | null;
};

/** يبني شجرة التصنيفات المنشورة فقط مع عدادات دروس/سلاسل حقيقية (مباشرة+فروع). */
export async function fetchPublishedCategoryTree(): Promise<CategoryWithCounts[]> {
  const [{ data: cats }, { data: lessonRows }, { data: seriesRows }] = await Promise.all([
    supabase.from("categories").select("id, parent_id, slug, name, description, icon, sort_order, status").eq("status", "published").order("sort_order"),
    supabase.from("lessons").select("category_id").eq("status", "approved").not("category_id", "is", null),
    supabase.from("lesson_series").select("category_id").eq("status", "published").not("category_id", "is", null),
  ]);

  const categories = (cats ?? []) as CategoryRow[];
  const directLessonCounts = new Map<string, number>();
  for (const r of lessonRows ?? []) {
    const id = (r as { category_id: string }).category_id;
    directLessonCounts.set(id, (directLessonCounts.get(id) ?? 0) + 1);
  }
  const directSeriesCounts = new Map<string, number>();
  for (const r of seriesRows ?? []) {
    const id = (r as { category_id: string }).category_id;
    directSeriesCounts.set(id, (directSeriesCounts.get(id) ?? 0) + 1);
  }

  const withCounts = categories.map((c) => ({
    ...c,
    lessonCount: directLessonCounts.get(c.id) ?? 0,
    seriesCount: directSeriesCounts.get(c.id) ?? 0,
  }));
  const roots = buildCategoryTree(withCounts) as CategoryWithCounts[];
  for (const r of roots) rollUpCounts(r);
  return roots;
}

export type CategoryDetail = {
  category: CategoryRow;
  breadcrumb: CategoryRow[];
  children: CategoryRow[];
  series: SeriesSummary[];
  lessons: LessonSummary[];
};

export async function fetchCategoryDetail(slug: string): Promise<CategoryDetail | null> {
  const { data: category } = await supabase
    .from("categories")
    .select("id, parent_id, slug, name, description, icon, sort_order, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!category) return null;

  const breadcrumb: CategoryRow[] = [];
  let cursor: CategoryRow | null = category as CategoryRow;
  while (cursor?.parent_id) {
    const { data: parent } = await supabase
      .from("categories")
      .select("id, parent_id, slug, name, description, icon, sort_order, status")
      .eq("id", cursor.parent_id)
      .maybeSingle();
    if (!parent) break;
    breadcrumb.unshift(parent as CategoryRow);
    cursor = parent as CategoryRow;
  }

  const [{ data: children }, { data: series }, { data: lessons }] = await Promise.all([
    supabase.from("categories").select("id, parent_id, slug, name, description, icon, sort_order, status").eq("parent_id", category.id).eq("status", "published").order("sort_order"),
    supabase.from("lesson_series").select("id, slug, title, description, level, category_id, related_course_id").eq("category_id", category.id).eq("status", "published").order("sort_order"),
    supabase.from("lessons").select("id, title, description, category_id, activity_type, session_count, sheikh_id").eq("category_id", category.id).eq("status", "approved"),
  ]);

  return {
    category: category as CategoryRow,
    breadcrumb,
    children: (children ?? []) as CategoryRow[],
    series: (series ?? []) as SeriesSummary[],
    lessons: (lessons ?? []) as LessonSummary[],
  };
}

export type SeriesDetail = {
  series: SeriesSummary;
  items: Array<{ sortOrder: number; isRequired: boolean; lesson: LessonSummary }>;
};

export async function fetchSeriesDetail(slug: string): Promise<SeriesDetail | null> {
  const { data: series } = await supabase
    .from("lesson_series")
    .select("id, slug, title, description, level, category_id, related_course_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!series) return null;

  const { data: links } = await supabase
    .from("series_lessons")
    .select("sort_order, is_required, lessons(id, title, description, category_id, activity_type, session_count, sheikh_id)")
    .eq("series_id", series.id)
    .order("sort_order");

  const items = (links ?? [])
    .filter((l: any) => l.lessons)
    .map((l: any) => ({ sortOrder: l.sort_order, isRequired: l.is_required, lesson: l.lessons as LessonSummary }));

  return { series: series as SeriesSummary, items };
}

export type LessonDetail = {
  lesson: LessonSummary & { category: CategoryRow | null; status: string };
  sections: Array<{ id: string; section_type: string; title: string | null; content: string; sort_order: number }>;
  citations: Array<{ id: string; source_type: string; citation: string; url: string | null }>;
  scholars: Array<{ id: string; role: string; scholar_id: string }>;
  books: Array<{ id: string; book_title: string; chapter_reference: string | null; library_item_id: string | null }>;
};

export async function fetchLessonDetail(lessonId: string): Promise<LessonDetail | null> {
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, description, category_id, activity_type, session_count, sheikh_id, status")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return null;

  const [{ data: category }, { data: sections }, { data: citations }, { data: scholars }, { data: books }] = await Promise.all([
    lesson.category_id
      ? supabase.from("categories").select("id, parent_id, slug, name, description, icon, sort_order, status").eq("id", lesson.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("lesson_sections").select("id, section_type, title, content, sort_order").eq("lesson_id", lessonId).order("sort_order"),
    supabase.from("lesson_citations").select("id, source_type, citation, url").eq("lesson_id", lessonId).order("sort_order"),
    supabase.from("lesson_scholars").select("id, role, scholar_id").eq("lesson_id", lessonId),
    supabase.from("lesson_books").select("id, book_title, chapter_reference, library_item_id").eq("lesson_id", lessonId).order("sort_order"),
  ]);

  return {
    lesson: { ...(lesson as any), category: (category ?? null) as CategoryRow | null },
    sections: (sections ?? []) as LessonDetail["sections"],
    citations: (citations ?? []) as LessonDetail["citations"],
    scholars: (scholars ?? []) as LessonDetail["scholars"],
    books: (books ?? []) as LessonDetail["books"],
  };
}
