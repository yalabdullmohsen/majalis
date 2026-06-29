import { arabicMatchAny } from "@/lib/arabic-search";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { ResearchAuthor, ResearchListOptions, ResearchPaper } from "./types";
import { RESEARCH_SEED_AUTHORS, RESEARCH_SEED_PAPERS } from "./seed";
import { CATEGORY_CARDS, RESEARCH_BASE_PATH } from "./constants";

const TABLE = "research_papers";
const AUTHORS_TABLE = "research_authors";

function sortPapers(papers: ResearchPaper[], sort: ResearchListOptions["sort"] = "newest") {
  const list = [...papers];
  switch (sort) {
    case "views":
      return list.sort((a, b) => b.views_count - a.views_count);
    case "downloads":
      return list.sort((a, b) => b.downloads_count - a.downloads_count);
    case "rating":
      return list.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    case "saves":
      return list.sort((a, b) => b.saves_count - a.saves_count);
    default:
      return list.sort(
        (a, b) =>
          new Date(b.published_at || b.created_at || 0).getTime() -
          new Date(a.published_at || a.created_at || 0).getTime(),
      );
  }
}

function filterSeedPapers(options: ResearchListOptions): ResearchPaper[] {
  let list = RESEARCH_SEED_PAPERS.filter((p) => p.status === "published");

  if (options.category && options.category !== "latest" && options.category !== "all") {
    if (options.category === "phd") list = list.filter((p) => p.degree_type === "phd");
    else if (options.category === "masters") list = list.filter((p) => p.degree_type === "masters");
    else if (options.category === "bachelors") list = list.filter((p) => p.degree_type === "bachelors");
    else list = list.filter((p) => p.category_slug === options.category);
  }

  if (options.degree && options.degree !== "all") {
    list = list.filter((p) => p.degree_type === options.degree);
  }
  if (options.university) {
    list = list.filter((p) => p.university?.includes(options.university!));
  }
  if (options.country) {
    list = list.filter((p) => p.country === options.country);
  }
  if (options.year) {
    list = list.filter((p) => p.publication_year === options.year);
  }
  if (options.language) {
    list = list.filter((p) => p.language === options.language);
  }
  if (options.search?.trim()) {
    const q = options.search.trim();
    list = list.filter((p) =>
      arabicMatchAny(
        [
          p.title,
          p.author_name,
          p.supervisor_name,
          p.university,
          p.faculty,
          p.department,
          p.specialization,
          p.abstract_short,
          p.abstract_full,
          ...(p.keywords || []),
          String(p.publication_year || ""),
        ],
        q,
      ),
    );
  }

  return sortPapers(list, options.sort).slice(options.offset || 0, (options.offset || 0) + (options.limit || 50));
}

async function fetchFromSupabase(options: ResearchListOptions) {
  const { supabase } = await import("@/lib/supabase");
  let q = supabase.from(TABLE).select("*").eq("status", "published");

  if (options.category && options.category !== "latest" && options.category !== "all") {
    if (["phd", "masters", "bachelors"].includes(options.category)) {
      q = q.eq("degree_type", options.category);
    } else {
      q = q.eq("category_slug", options.category);
    }
  }
  if (options.degree && options.degree !== "all") q = q.eq("degree_type", options.degree);
  if (options.university) q = q.ilike("university", `%${options.university}%`);
  if (options.country) q = q.eq("country", options.country);
  if (options.year) q = q.eq("publication_year", options.year);
  if (options.language) q = q.eq("language", options.language);

  const sortCol =
    options.sort === "views"
      ? "views_count"
      : options.sort === "downloads"
        ? "downloads_count"
        : options.sort === "rating"
          ? "rating_avg"
          : options.sort === "saves"
            ? "saves_count"
            : "published_at";

  q = q.order(sortCol, { ascending: false, nullsFirst: false });
  if (options.limit) q = q.limit(options.limit);
  if (options.offset) q = q.range(options.offset, options.offset + (options.limit || 50) - 1);

  const { data, error } = await q;
  if (error) throw error;

  let papers = (data || []) as ResearchPaper[];
  if (options.search?.trim()) {
    papers = papers.filter((p) =>
      arabicMatchAny(
        [
          p.title,
          p.author_name,
          p.supervisor_name,
          p.university,
          p.faculty,
          p.department,
          p.abstract_full,
          ...(p.keywords || []),
        ],
        options.search!.trim(),
      ),
    );
  }
  return papers;
}

export async function getResearchPapers(options: ResearchListOptions = {}) {
  if (!isSupabaseConfigured()) {
    return { data: filterSeedPapers(options), source: "seed" as const };
  }
  try {
    const data = await fetchFromSupabase(options);
    if (data.length) return { data, source: "database" as const };
    return { data: filterSeedPapers(options), source: "seed_fallback" as const };
  } catch {
    return { data: filterSeedPapers(options), source: "seed_fallback" as const };
  }
}

export async function getResearchPaperBySlug(slug: string) {
  if (isSupabaseConfigured()) {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
      if (data) return { data: data as ResearchPaper, source: "database" as const };
    } catch {
      /* fallback */
    }
  }
  const seed = RESEARCH_SEED_PAPERS.find((p) => p.slug === slug);
  return seed ? { data: seed, source: "seed" as const } : { data: null, source: "none" as const };
}

export async function getResearchAuthorBySlug(slug: string) {
  if (isSupabaseConfigured()) {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.from(AUTHORS_TABLE).select("*").eq("slug", slug).maybeSingle();
      if (data) return { data: data as ResearchAuthor, source: "database" as const };
    } catch {
      /* fallback */
    }
  }
  const seed = RESEARCH_SEED_AUTHORS.find((a) => a.slug === slug);
  return seed ? { data: seed, source: "seed" as const } : { data: null, source: "none" as const };
}

export async function getAuthorPapers(authorSlug: string) {
  const authorResult = await getResearchAuthorBySlug(authorSlug);
  if (!authorResult.data) return { data: [], author: null };

  const { data: all } = await getResearchPapers({ limit: 200 });
  const papers = all.filter(
    (p) =>
      p.author_id === authorResult.data!.id ||
      p.author_name === authorResult.data!.full_name,
  );
  return { data: papers, author: authorResult.data };
}

export function getCategoryCards() {
  return CATEGORY_CARDS;
}

export function searchScientificResearchSync(query: string, limit = 12) {
  const q = query.trim();
  if (!q) return [];
  const papers = filterSeedPapers({ search: q, limit, category: "all" });
  return papers.map((p) => ({
    id: p.id,
    title: p.title,
    meta: [p.author_name, p.university, p.specialization].filter(Boolean).join(" · "),
    href: `${RESEARCH_BASE_PATH}/${p.slug}`,
  }));
}

export function buildResearchJsonLd(paper: ResearchPaper) {
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: paper.title,
    author: { "@type": "Person", name: paper.author_name },
    datePublished: paper.published_at || undefined,
    inLanguage: paper.language,
    keywords: (paper.keywords || []).join(", "),
    abstract: paper.abstract_short || paper.abstract_full,
    publisher: { "@type": "Organization", name: paper.university || "المجلس العلمي" },
    ...(paper.pdf_url ? { url: paper.pdf_url } : {}),
  };
}

export function buildThesisJsonLd(paper: ResearchPaper) {
  return {
    "@context": "https://schema.org",
    "@type": "Thesis",
    name: paper.title,
    author: { "@type": "Person", name: paper.author_name },
    datePublished: paper.published_at || undefined,
    inLanguage: paper.language,
    abstract: paper.abstract_full,
  };
}
