/**
 * AI enrichment extensions — structured metadata, SEO, JSON-LD, related content.
 */

export function enrichAnalysisMetadata(analysis, item, context = {}) {
  const kind = item.content_kind || "article";
  const base = { ...analysis };

  base.educational_level = inferEducationalLevel(kind, analysis);
  base.target_audience = inferTargetAudience(kind, analysis);
  base.related_lessons = context.related_lessons || [];
  base.related_books = context.related_books || [];
  base.related_fatwas = context.related_fatwas || [];
  base.opengraph = buildOpenGraph(base, item);
  base.json_ld = buildJsonLd(base, item);
  base.seo_schema = buildSeoSchema(base, item);

  return base;
}

function inferEducationalLevel(kind, analysis) {
  const text = `${analysis.ai_summary || ""} ${analysis.ai_title || ""}`;
  if (kind === "course" || kind === "annual_course") return "intermediate";
  if (kind === "lesson" || kind === "lecture") return "general";
  if (kind === "fiqh_decision" || kind === "fatwa") return "advanced";
  if (text.includes("مبتدئ") || text.includes("تأسيس")) return "beginner";
  if (text.includes("متقدم") || text.includes("تخصص")) return "advanced";
  return "general";
}

function inferTargetAudience(kind, analysis) {
  const map = {
    fawaid: "general_muslims",
    lesson: "students_of_knowledge",
    lecture: "students_of_knowledge",
    course: "students_of_knowledge",
    fiqh_decision: "scholars_and_students",
    fatwa: "general_muslims",
    book: "students_of_knowledge",
    event: "community",
    news: "general_public",
  };
  return map[kind] || "general_muslims";
}

function buildOpenGraph(analysis, item) {
  const title = analysis.seo_title || analysis.ai_title || item.raw_title || "";
  const description = analysis.seo_description || analysis.ai_summary || "";
  const url = item.raw_url || item.source_url || "";
  return {
    "og:type": "article",
    "og:title": title.slice(0, 70),
    "og:description": description.slice(0, 160),
    "og:url": url,
    "og:locale": analysis.ai_language === "en" ? "en_US" : "ar_SA",
    "og:site_name": "مجالس العلم",
    "article:section": analysis.ai_category || "Islamic Knowledge",
    "article:tag": (analysis.ai_keywords || []).slice(0, 5),
  };
}

function buildJsonLd(analysis, item) {
  const url = item.raw_url || item.source_url || "";
  const kind = item.content_kind || "article";

  const base = {
    "@context": "https://schema.org",
    "@type": kind === "lesson" || kind === "lecture" ? "LearningResource" : "Article",
    headline: analysis.ai_title || item.raw_title,
    description: analysis.ai_summary,
    url,
    inLanguage: analysis.ai_language === "en" ? "en" : "ar",
    keywords: (analysis.ai_keywords || []).join(", "),
    author: analysis.ai_scholar
      ? { "@type": "Person", name: analysis.ai_scholar }
      : { "@type": "Organization", name: item.source_attribution || "مجالس العلم" },
  };

  if (item.published_at) {
    base.datePublished = item.published_at;
  }

  return base;
}

function buildSeoSchema(analysis, item) {
  return {
    title: analysis.seo_title || analysis.ai_title,
    description: analysis.seo_description || analysis.ai_summary?.slice(0, 160),
    keywords: analysis.ai_keywords || [],
    canonical: item.raw_payload?.canonical_url || item.raw_url,
    robots: analysis.needs_human_review ? "noindex, follow" : "index, follow",
    hreflang: analysis.ai_language === "en" ? "en" : "ar",
  };
}

export function mergeRelatedContent(recommendations = {}) {
  return {
    related_lessons: (recommendations.lessons || []).slice(0, 5).map((r) => ({ id: r.id, title: r.title })),
    related_books: (recommendations.books || []).slice(0, 5).map((r) => ({ id: r.id, title: r.title })),
    related_fatwas: (recommendations.fatwas || []).slice(0, 5).map((r) => ({ id: r.id, title: r.title })),
  };
}
