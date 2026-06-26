import seoData from "./seo-routes.json";
import type { KuwaitLessonRecord } from "./kuwait-lessons";

const SITE_URL = seoData.siteUrl;
const SITE_NAME = seoData.siteName;

function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(seoData.defaultImage),
    description:
      "منصة علمية عربية تجمع الدروس الشرعية والدورات والقرآن والأذكار والفوائد في مكان واحد.",
    inLanguage: "ar",
    sameAs: [SITE_URL],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ar",
    description:
      "منصة علمية عربية للدروس الشرعية والدورات العلمية وطلب العلم — القرآن، السنة، الأذكار، والفوائد.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: absoluteUrl(seoData.defaultImage),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search/{search_term_string}`,
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

function lessonEventType(lesson: KuwaitLessonRecord) {
  if (lesson.isCourse || lesson.activityType === "دورة") return "Course";
  return "EducationEvent";
}

export function lessonJsonLd(lesson: KuwaitLessonRecord) {
  const path = `/lessons/${lesson.id}`;
  const image = lesson.sheikhImage || lesson.lessonImage || seoData.defaultImage;
  const type = lessonEventType(lesson);

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name: lesson.title,
    description: lesson.description || lesson.note || `${lesson.title} — ${lesson.sheikhName}`,
    url: absoluteUrl(path),
    image: absoluteUrl(image.startsWith("http") ? image : image),
    inLanguage: "ar",
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    performer: {
      "@type": "Person",
      name: lesson.sheikhName.replace(/^الشيخ:\s*/u, ""),
    },
    location: lesson.mosque
      ? {
          "@type": "Place",
          name: lesson.mosque,
          address: {
            "@type": "PostalAddress",
            addressLocality: lesson.region || lesson.governorate || "الكويت",
            addressCountry: "KW",
          },
        }
      : undefined,
    keywords: (lesson.keywords || [lesson.category]).join(", "),
  };

  if (lesson.startDate || lesson.gregorianDate) {
    base.startDate = lesson.startDate || lesson.gregorianDate;
  }
  if (lesson.endDate) {
    base.endDate = lesson.endDate;
  }

  return base;
}

export function lessonSeoMeta(lesson: KuwaitLessonRecord) {
  const sheikh = lesson.sheikhName.replace(/^الشيخ:\s*/u, "").trim();
  const place = lesson.mosque || lesson.region || "";
  const schedule = [lesson.day, lesson.time, lesson.gregorianDate].filter(Boolean).join(" · ");
  const title = `${lesson.title} | ${SITE_NAME}`;
  const description = [
    sheikh ? `الشيخ: ${sheikh}` : "",
    place ? `المكان: ${place}` : "",
    schedule,
    lesson.category ? `التصنيف: ${lesson.category}` : "",
  ]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 160);

  const keywords = [
    lesson.title,
    sheikh,
    lesson.category,
    lesson.activityType,
    "دروس شرعية",
    "دروس علمية",
    "دروس شرعية",
    "دورات شرعية",
    "طلب العلم",
    SITE_NAME,
    ...(lesson.keywords || []),
  ].filter(Boolean);

  const image = lesson.sheikhImage || lesson.lessonImage || seoData.defaultImage;

  return {
    title,
    description: description || `${lesson.title} — درس شرعي على ${SITE_NAME}`,
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
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    description: person.description,
    url: absoluteUrl(person.url),
    image: person.image ? absoluteUrl(person.image.startsWith("http") ? person.image : person.image) : undefined,
    jobTitle: person.jobTitle ?? "عالم",
    knowsAbout: person.knowsAbout,
  };
}

export function defaultSiteJsonLd() {
  return [organizationJsonLd(), websiteJsonLd()];
}
