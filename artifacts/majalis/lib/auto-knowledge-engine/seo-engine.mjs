/**
 * SEO Engine — Title, OG, Twitter, JSON-LD, Breadcrumb, Schema.org
 */

const SITE_NAME = "المجلس العلمي";
const SITE_URL = "https://www.majlisilm.com";

const SCHEMA_MAP = {
  fatwa: "FAQPage",
  fiqh_decision: "Article",
  resolution: "Article",
  article: "Article",
  news: "NewsArticle",
  book: "Book",
  lesson: "Course",
  lecture: "Course",
  course: "Course",
  fawaid: "Article",
  miracle: "Article",
  qa: "FAQPage",
  sheikh: "Person",
};

export function buildSeoPackage(item, analysis, routePath) {
  const title = analysis?.seo_title || analysis?.ai_title || item.raw_title || "";
  const description = analysis?.seo_description || analysis?.ai_summary || "";
  const canonical = `${SITE_URL}${routePath || ""}`;
  const schemaType = SCHEMA_MAP[item.content_kind] || "Article";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": schemaType,
      headline: title,
      description: description.slice(0, 160),
      url: canonical,
      datePublished: item.published_at || new Date().toISOString(),
      author: analysis?.ai_scholar
        ? { "@type": "Person", name: analysis.ai_scholar }
        : { "@type": "Organization", name: item.source_attribution || SITE_NAME },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
      inLanguage: analysis?.ai_language || "ar",
      keywords: (analysis?.ai_keywords || []).join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: buildBreadcrumb(routePath, title),
    },
  ];

  if (schemaType === "FAQPage" && item.raw_title && item.raw_body) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: {
        "@type": "Question",
        name: item.raw_title,
        acceptedAnswer: { "@type": "Answer", text: (analysis?.ai_summary || item.raw_body).slice(0, 500) },
      },
    });
  }

  if (analysis?.ai_scholar) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "Person",
      name: analysis.ai_scholar,
    });
  }

  return {
    title: `${title} | ${SITE_NAME}`.slice(0, 70),
    description: description.slice(0, 160),
    canonical,
    robots: "index,follow",
    og_title: title.slice(0, 70),
    og_description: description.slice(0, 160),
    og_type: schemaType === "NewsArticle" ? "article" : "website",
    og_url: canonical,
    twitter_title: title.slice(0, 70),
    twitter_description: description.slice(0, 160),
    twitter_card: "summary_large_image",
    json_ld: jsonLd,
    breadcrumb: buildBreadcrumb(routePath, title),
    schema_types: [...new Set([schemaType, "BreadcrumbList", analysis?.ai_scholar ? "Person" : "Organization"])],
  };
}

function buildBreadcrumb(path, title) {
  const crumbs = [{ name: "الرئيسية", path: "/" }];
  if (path?.includes("/fatwa")) crumbs.push({ name: "الفتاوى", path: "/fatwa" });
  else if (path?.includes("/fiqh")) crumbs.push({ name: "المجمع الفقهي", path: "/fiqh-council" });
  else if (path?.includes("/fawaid")) crumbs.push({ name: "الفوائد", path: "/fawaid" });
  else if (path?.includes("/library")) crumbs.push({ name: "المكتبة", path: "/library" });
  else if (path?.includes("/lessons")) crumbs.push({ name: "الدروس", path: "/lessons" });
  else if (path?.includes("/updates")) crumbs.push({ name: "المستجدات", path: "/updates" });
  else crumbs.push({ name: "المحتوى", path: "/search" });
  crumbs.push({ name: title.slice(0, 60), path: path || "/" });
  return crumbs;
}

export function routeForKind(kind, recordId) {
  const routes = {
    fatwa: `/fatwa/${recordId}`,
    fiqh_decision: `/fiqh-council/${recordId}`,
    resolution: `/fiqh-council/${recordId}`,
    fawaid: `/fawaid`,
    book: `/library`,
    article: `/library`,
    lesson: `/lessons/${recordId}`,
    lecture: `/lessons/${recordId}`,
    course: `/lessons/${recordId}`,
    miracle: `/miracles`,
    qa: `/qa`,
    news: `/updates`,
    announcement: `/updates`,
  };
  return routes[kind] || `/search`;
}

export async function persistSeoCache(admin, contentKey, seo) {
  if (!admin) return;
  try {
    await admin.from("ake_seo_cache").upsert({
      content_key: contentKey,
      path: seo.canonical?.replace(SITE_URL, "") || null,
      title: seo.title,
      description: seo.description,
      canonical: seo.canonical,
      robots: seo.robots,
      og_title: seo.og_title,
      og_description: seo.og_description,
      twitter_title: seo.twitter_title,
      twitter_description: seo.twitter_description,
      json_ld: seo.json_ld,
      breadcrumb: seo.breadcrumb,
      schema_types: seo.schema_types,
      updated_at: new Date().toISOString(),
    });
  } catch {
    /* table may not exist */
  }
}
