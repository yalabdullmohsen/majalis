/**
 * طبقة قراءة عامة لمكتبة "تعلّم" (شجرة التصنيفات + الدروس المُهيكَلة +
 * السلاسل) — كل الاستعلامات هنا تفترض RLS العام (status='published'/'approved'
 * فقط، أو is_admin()) كخط الدفاع الحقيقي، تمامًا كنمط learning-paths-service.ts.
 */
import { supabase } from "@/lib/supabase";
import { buildCategoryTree, rollUpCounts } from "@/lib/category-tree";
import { isPublicVisibleStatus } from "@/lib/category-status";
import {
  getSeedLessonById as getBatch3LessonById,
  getSeedLessonsForSlug as getBatch3LessonsForSlug,
  isAqeedahBatch3Slug,
  seedLessonCountForSlug as batch3LessonCountForSlug,
  type AqeedahSeedLesson,
} from "@/lib/learn-library-aqeedah-batch3-seed";
import {
  BATCH1_CATEGORY_NAMES,
  batch1LessonCountForSlug,
  getBatch1LessonById,
  getBatch1LessonsForSlug,
  isAqeedahBatch1Slug,
} from "@/lib/learn-library-aqeedah-batch1-seed";

function isAqeedahSeedSlug(slug: string): boolean {
  return isAqeedahBatch3Slug(slug) || isAqeedahBatch1Slug(slug);
}

function getSeedLessonsForSlug(slug: string): AqeedahSeedLesson[] {
  if (isAqeedahBatch3Slug(slug)) return getBatch3LessonsForSlug(slug);
  if (isAqeedahBatch1Slug(slug)) return getBatch1LessonsForSlug(slug);
  return [];
}

function getSeedLessonById(id: string): AqeedahSeedLesson | null {
  return getBatch3LessonById(id) ?? getBatch1LessonById(id);
}

function seedLessonCountForSlug(slug: string): number {
  if (isAqeedahBatch3Slug(slug)) return batch3LessonCountForSlug(slug);
  if (isAqeedahBatch1Slug(slug)) return batch1LessonCountForSlug(slug);
  return 0;
}

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

  // دفاع إضافي: حتى لو تغيّرت سياسة RLS، لا يظهر للمستخدم غير المنشور
  const categories = ((cats ?? []) as CategoryRow[]).filter((c) => isPublicVisibleStatus(c.status));
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

  const withCounts = categories.map((c) => {
    const dbCount = directLessonCounts.get(c.id) ?? 0;
    // إن كان التصنيف من دفعة العقيدة الفارغة على الإنتاج: أظهر عدّ البذرة حتى يُطبَّق SQL.
    const seedExtra =
      isAqeedahSeedSlug(c.slug) && dbCount === 0 ? seedLessonCountForSlug(c.slug) : 0;
    return {
      ...c,
      lessonCount: dbCount + seedExtra,
      seriesCount: directSeriesCounts.get(c.id) ?? 0,
    };
  });
  const roots = buildCategoryTree(withCounts) as CategoryWithCounts[];
  for (const r of roots) rollUpCounts(r);

  /** إخفاء الأبواب الخالية (لا دروس ولا سلاسل ولا فروع ذات محتوى) حتى لا تُربط صفحات فارغة. */
  function hasContent(c: CategoryWithCounts): boolean {
    if (c.lessonCount > 0 || c.seriesCount > 0) return true;
    return c.children.some(hasContent);
  }
  return roots
    .map((r) => ({ ...r, children: r.children.filter(hasContent) }))
    .filter(hasContent);
}

function seedToSummary(seed: AqeedahSeedLesson, categoryId: string): LessonSummary {
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    category_id: categoryId,
    activity_type: seed.activity_type,
    session_count: null,
    sheikh_id: null,
  };
}

function seedToLessonDetail(seed: AqeedahSeedLesson, category: CategoryRow | null): LessonDetail {
  return {
    lesson: {
      ...seedToSummary(seed, category?.id ?? seed.categorySlug),
      category,
      status: "approved",
    },
    sections: seed.sections.map((s) => ({
      id: s.id,
      section_type: s.section_type,
      title: s.title,
      content: s.content,
      sort_order: s.sort_order,
    })),
    citations: seed.citations.map((c) => ({
      id: c.id,
      source_type: c.source_type,
      citation: c.citation,
      url: c.url,
    })),
    scholars: [],
    books: [],
  };
}

/** فئة احتياطية محلية إن لم تُرجع قاعدة البيانات التصنيف (بيئة بلا بيانات). */
function localCategoryForSlug(slug: string): CategoryRow | null {
  const names: Record<string, string> = {
    "iman-billah": "الإيمان بالله",
    "aqsam-tawheed": "أقسام التوحيد الثلاثة",
    "nawaqid-islam": "نواقض الإسلام",
    "aqeedat-ahl-sunnah": "عقيدة أهل السنة والجماعة",
    ...BATCH1_CATEGORY_NAMES,
  };
  if (!isAqeedahSeedSlug(slug) || !names[slug]) return null;
  return {
    id: `seed-cat-${slug}`,
    parent_id: "seed-cat-aqeedah-tawheed",
    slug,
    name: names[slug],
    description: "دروس معتمدة على منهج أهل السنة — بذرة واجهة حتى يُطبَّق SQL الإنتاجي",
    icon: null,
    sort_order: 0,
    status: "published",
  };
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

  // احتياطي كامل للتصنيفات الأربعة إن غابت عن البيئة المحلية.
  if (!category) {
    const local = localCategoryForSlug(slug);
    if (!local) return null;
    const seedLessons = getSeedLessonsForSlug(slug).map((s) => seedToSummary(s, local.id));
    return {
      category: local,
      breadcrumb: [{
        id: "seed-cat-aqeedah-tawheed",
        parent_id: null,
        slug: "aqeedah-tawheed",
        name: "العقيدة والتوحيد",
        description: null,
        icon: null,
        sort_order: 0,
        status: "published",
      }],
      children: [],
      series: [],
      lessons: seedLessons,
    };
  }

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

  const dbLessons = (lessons ?? []) as LessonSummary[];
  const existingTitles = new Set(dbLessons.map((l) => l.title));
  const merged = [...dbLessons];
  if (isAqeedahSeedSlug(slug)) {
    for (const seed of getSeedLessonsForSlug(slug)) {
      if (!existingTitles.has(seed.title)) {
        merged.push(seedToSummary(seed, (category as CategoryRow).id));
      }
    }
  }

  return {
    category: category as CategoryRow,
    breadcrumb,
    children: (children ?? []) as CategoryRow[],
    series: (series ?? []) as SeriesSummary[],
    lessons: merged,
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
  // دروس البذرة تُخدم مباشرة بلا استعلام DB (لا UUID إنتاجي).
  if (lessonId.startsWith("seed-aqeedah-")) {
    const seed = getSeedLessonById(lessonId);
    if (!seed) return null;
    const localCat = localCategoryForSlug(seed.categorySlug);
    const { data: dbCat } = await supabase
      .from("categories")
      .select("id, parent_id, slug, name, description, icon, sort_order, status")
      .eq("slug", seed.categorySlug)
      .maybeSingle();
    return seedToLessonDetail(seed, (dbCat as CategoryRow | null) ?? localCat);
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, description, category_id, activity_type, session_count, sheikh_id, status")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) {
    const seed = getSeedLessonById(lessonId);
    if (!seed) return null;
    return seedToLessonDetail(seed, localCategoryForSlug(seed.categorySlug));
  }

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
