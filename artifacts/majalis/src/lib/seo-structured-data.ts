import { SEO_SITE } from "./seo-nav-labels";
import type { KuwaitLessonRecord } from "./kuwait-lessons";
import { formatSheikhName, stripSheikhHonorifics } from "./sheikh-name";

const SITE_URL = SEO_SITE.siteUrl;
const SITE_NAME = SEO_SITE.siteName;
const LOGO_PATH = SEO_SITE.logoImage || "/brand/official.png?v=20260825";
const DEFAULT_IMAGE = SEO_SITE.defaultImage || "/brand/official-og.png?v=20260825";

function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

/** رابط مطلق على النطاق المعتمد (بلا www). */
export function siteAbsoluteUrl(path = "/") {
  return absoluteUrl(path);
}

export function getSeoSiteUrl() {
  return SITE_URL;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(LOGO_PATH),
    },
    image: absoluteUrl(DEFAULT_IMAGE),
    description:
      "منصة علمية عربية تجمع الدروس الشرعية والدورات والقرآن والأذكار والفوائد في مكان واحد.",
    inLanguage: "ar",
    sameAs: ["https://www.instagram.com/Majlisalilm"],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteUrl(DEFAULT_IMAGE),
    inLanguage: "ar",
    description:
      "منصة علمية عربية للدروس الشرعية والدورات العلمية وطلب العلم — القرآن، السنة، الأذكار، والفوائد.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(LOGO_PATH),
      },
      url: SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function lessonJsonLd(lesson: KuwaitLessonRecord) {
  const path = `/lessons/${lesson.id}`;
  const image = lesson.sheikhImage || lesson.lessonImage || DEFAULT_IMAGE;
  const sheikh = String(lesson.sheikhName || "")
    .replace(/^الشيخ:\s*/u, "")
    .trim();

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.description || lesson.note || `${lesson.title}${sheikh ? ` — ${sheikh}` : ""}`,
    url: absoluteUrl(path),
    image: absoluteUrl(image.startsWith("http") ? image : image),
    inLanguage: "ar",
    learningResourceType: lesson.isCourse || lesson.activityType === "دورة" ? "دورة علمية" : "درس شرعي",
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  if (sheikh) {
    base.author = { "@type": "Person", name: sheikh };
  }
  if (lesson.mosque) {
    base.spatialCoverage = {
      "@type": "Place",
      name: lesson.mosque,
      address: {
        "@type": "PostalAddress",
        addressLocality: lesson.region || lesson.governorate || "الكويت",
        addressCountry: "KW",
      },
    };
  }
  const keywords = (lesson.keywords || [lesson.category]).filter(Boolean);
  if (keywords.length) base.keywords = keywords.join(", ");
  if (lesson.startDate || lesson.gregorianDate) {
    base.datePublished = lesson.startDate || lesson.gregorianDate;
  }

  return base;
}

export function lessonSeoMeta(lesson: KuwaitLessonRecord) {
  const sheikhLabel = formatSheikhName(lesson.sheikhName);
  const sheikhCore = stripSheikhHonorifics(lesson.sheikhName);
  const place = lesson.mosque || lesson.region || "";
  const schedule = [lesson.day, lesson.time, lesson.gregorianDate].filter(Boolean).join(" · ");
  const rawTitle = String(lesson.title || "درس شرعي").trim();
  const titleCore =
    rawTitle.length <= 42 ? rawTitle : `${rawTitle.slice(0, 41).trimEnd()}…`;
  const title = `${titleCore} | ${SITE_NAME}`;
  let description = [
    sheikhLabel,
    place ? `المكان: ${place}` : "",
    schedule,
    lesson.category ? `التصنيف: ${lesson.category}` : "",
  ]
    .filter(Boolean)
    .join(" — ");
  if (!description) description = `${lesson.title} — درس شرعي على ${SITE_NAME}`;
  if (description.length < 120) {
    description = `${description} — درس شرعي موثّق ضمن منصة ${SITE_NAME}.`;
  }
  if (description.length > 160) description = `${description.slice(0, 159).trimEnd()}…`;

  const keywords = [
    lesson.title,
    sheikhCore,
    lesson.category,
    lesson.activityType,
    "دروس شرعية",
    "دروس علمية",
    "دورات شرعية",
    "طلب العلم",
    SITE_NAME,
    ...(lesson.keywords || []),
  ].filter(Boolean);

  const image = lesson.sheikhImage || lesson.lessonImage || DEFAULT_IMAGE;

  return {
    title,
    description,
    keywords: [...new Set(keywords)],
    canonicalPath: `/lessons/${lesson.id}`,
    image: image.startsWith("http") ? image : absoluteUrl(image),
    ogType: lesson.isCourse ? "website" : "article",
  };
}

export function webPageJsonLd(title: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: absoluteUrl(path),
    inLanguage: "ar",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function personJsonLd(person: {
  name: string;
  description?: string;
  url: string;
  image?: string;
  jobTitle?: string;
  knowsAbout?: string[];
}) {
  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    url: absoluteUrl(person.url),
  };
  if (person.description) payload.description = person.description;
  if (person.image) {
    payload.image = absoluteUrl(person.image.startsWith("http") ? person.image : person.image);
  }
  if (person.jobTitle) payload.jobTitle = person.jobTitle;
  if (person.knowsAbout?.length) payload.knowsAbout = person.knowsAbout;
  return payload;
}

export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.slice(0, 50).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function bookJsonLd(book: {
  name: string;
  description?: string;
  url: string;
  author?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.name,
    description: book.description,
    url: absoluteUrl(book.url),
    inLanguage: "ar",
    image: book.image ? absoluteUrl(book.image.startsWith("http") ? book.image : book.image) : undefined,
    author: book.author ? { "@type": "Person", name: book.author } : undefined,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

/** مسألة/درس فقهي — LearningResource للفهرسة الغنية. */
export function learningResourceJsonLd(resource: {
  name: string;
  description?: string;
  url: string;
  about?: string;
  educationalLevel?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: resource.name,
    description: resource.description,
    url: absoluteUrl(resource.url),
    inLanguage: "ar",
    learningResourceType: "مسألة فقهية",
    educationalLevel: resource.educationalLevel,
    about: resource.about,
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export function prophetArticleJsonLd(prophet: {
  name: string;
  slug: string;
  description?: string;
  image?: string;
}) {
  const url = `/prophets/${prophet.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `قصة ${prophet.name} عليه السلام`,
    description: prophet.description || `قصة نبي الله ${prophet.name} عليه السلام من المصادر الموثوقة.`,
    url: absoluteUrl(url),
    inLanguage: "ar",
    image: prophet.image ? absoluteUrl(prophet.image) : absoluteUrl(DEFAULT_IMAGE),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: absoluteUrl(DEFAULT_IMAGE) },
    about: { "@type": "Person", name: prophet.name, description: `نبي الله ${prophet.name} عليه السلام` },
  };
}

/** Structured data for a Quran surah landing / mushaf context page. */
export function surahJsonLd(surah: {
  number: number;
  name: string;
  description?: string;
  url: string;
  ayahCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `سورة ${surah.name}`,
    alternateName: `Surah ${surah.number}`,
    description:
      surah.description ||
      `سورة ${surah.name} من القرآن الكريم — قراءة وتلاوة في المجلس العلمي.`,
    url: absoluteUrl(surah.url),
    inLanguage: "ar",
    isPartOf: {
      "@type": "CreativeWork",
      name: "القرآن الكريم",
      inLanguage: "ar",
    },
    position: surah.number,
    ...(typeof surah.ayahCount === "number"
      ? { numberOfPages: surah.ayahCount }
      : {}),
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export function islamicStoryJsonLd(story: {
  id: string | number;
  title: string;
  body?: string;
  category?: string;
}) {
  const url = `/stories/${story.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description: story.body ? story.body.slice(0, 160) : `${story.title} — قصة إسلامية موثقة.`,
    url: absoluteUrl(url),
    inLanguage: "ar",
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: absoluteUrl(DEFAULT_IMAGE) },
    genre: story.category || "قصة إسلامية",
  };
}

export function defaultSiteJsonLd() {
  return [organizationJsonLd(), websiteJsonLd()];
}
