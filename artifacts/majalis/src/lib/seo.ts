import { useEffect } from "react";
import seoData from "./seo-routes.json";
import {
  breadcrumbJsonLd,
  defaultSiteJsonLd,
  lessonJsonLd,
  lessonSeoMeta,
  webPageJsonLd,
} from "./seo-structured-data";
import type { KuwaitLessonRecord } from "./kuwait-lessons";

type SeoRoute = {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  robots?: string;
  ogType?: string;
};

export type PageSeoOptions = {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  robots?: string;
  image?: string;
  ogType?: string;
  canonicalPath?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

const routes = seoData.routes as SeoRoute[];
const JSON_LD_ID = "majalis-json-ld";

function requiredRoute(path: string) {
  const route = routes.find((item) => item.path === path);
  if (!route) {
    throw new Error(`Missing SEO route for ${path}`);
  }
  return route;
}

function absoluteUrl(path: string) {
  return new URL(path, seoData.siteUrl).toString();
}

export function normalizePath(path: string) {
  const cleanPath = path.split("?")[0].split("#")[0] || "/";
  if (cleanPath !== "/" && cleanPath.endsWith("/")) {
    return cleanPath.slice(0, -1);
  }
  return cleanPath;
}

function routeForPath(path: string) {
  const normalized = normalizePath(path);
  const exact = routes.find((route) => route.path === normalized);
  if (exact) return exact;

  if (normalized.startsWith("/search/")) {
    const term = decodeURIComponent(normalized.slice("/search/".length));
    return {
      ...requiredRoute("/search"),
      title: `نتائج البحث: ${term} | المجلس العلمي`,
      description: `نتائج البحث عن «${term}» في الدروس والمكتبة والفوائد داخل المجلس العلمي.`,
      robots: "noindex, follow",
    };
  }

  if (normalized === "/sheikhs") {
    return requiredRoute("/sheikhs");
  }

  if (normalized.startsWith("/sheikhs/")) {
    const name = decodeURIComponent(normalized.slice("/sheikhs/".length));
    return {
      ...requiredRoute("/sheikhs"),
      title: `${name} | المجلس العلمي`,
      description: `ملف الشيخ ${name} — سيرة وإجازات ودروس مرتبطة على المجلس العلمي.`,
    };
  }

  if (normalized.startsWith("/lessons/")) {
    return {
      ...requiredRoute("/lessons"),
      title: "تفاصيل الدرس | المجلس العلمي",
      description: "تفاصيل الدرس الشرعي — الشيخ، المكان، الجدول، والوصف داخل المجلس العلمي.",
    };
  }

  if (normalized.startsWith("/scientific-announcements/")) {
    return {
      ...requiredRoute("/lessons"),
      title: "تفاصيل الإعلان العلمي | المجلس العلمي",
      description: "تفاصيل إعلان درس علمي — الشيخ، المتن، الموعد، المكان، والروابط.",
    };
  }

  if (normalized.startsWith("/fiqh-council/")) {
    return {
      ...requiredRoute("/fiqh-council"),
      title: "قرار المجمع الفقهي | المجلس العلمي",
      description: "تفاصيل قرار أو بحث أو توصية من المجمع الفقهي الإسلامي.",
    };
  }

  if (normalized.startsWith("/fatwa/")) {
    return {
      ...requiredRoute("/fatwa"),
      title: "فتوى شرعية | المجلس العلمي",
      description: "تفاصيل فتوى شرعية — السؤال والجواب والمراجع.",
    };
  }

  if (normalized.startsWith("/rulings/")) {
    return {
      ...requiredRoute("/rulings"),
      title: "حكم شرعي | المجلس العلمي",
      description: "تفاصيل حكم شرعي مع الأدلة والمراجع.",
    };
  }

  if (normalized.startsWith("/annual-courses/")) {
    return {
      ...requiredRoute("/annual-courses"),
      title: "دورة علمية | المجلس العلمي",
      description: "تفاصيل دورة علمية — الجدول والمشايخ والتسجيل.",
    };
  }

  if (normalized === "/prophets") {
    return requiredRoute("/prophets");
  }

  if (normalized.startsWith("/prophets/")) {
    const prophetSlug = decodeURIComponent(normalized.slice("/prophets/".length));
    const PROPHET_NAMES: Record<string, string> = {
      adam: "آدم", idris: "إدريس", nuh: "نوح", hud: "هود",
      salih: "صالح", ibrahim: "إبراهيم", lut: "لوط", ismail: "إسماعيل",
      "is-haq": "إسحاق", yaqub: "يعقوب", yusuf: "يوسف", ayyub: "أيوب",
      shuayb: "شعيب", musa: "موسى", harun: "هارون", "dhul-kifl": "ذو الكفل",
      dawud: "داود", sulayman: "سليمان", ilyas: "إلياس", "al-yasa": "اليسع",
      yunus: "يونس", zakariyya: "زكريا", yahya: "يحيى", isa: "عيسى",
      muhammad: "محمد صلى الله عليه وسلم",
    };
    const arabicName = PROPHET_NAMES[prophetSlug] || prophetSlug;
    return {
      ...requiredRoute("/prophets"),
      path: normalized,
      title: `قصة ${arabicName} عليه السلام | المجلس العلمي`,
      description: `قصة نبي الله ${arabicName} عليه السلام — نبذة تعريفية وأبرز صفاته ومعجزاته والدروس المستخلصة من المصادر الموثوقة.`,
      ogType: "article",
    };
  }

  return requiredRoute("/404");
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function upsertJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  const payload = Array.isArray(data) ? data : [data];
  let element = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
  if (!element) {
    element = document.createElement("script");
    element.id = JSON_LD_ID;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(payload.length === 1 ? payload[0] : payload);
}

export function applyPageSeo(options: PageSeoOptions) {
  const normalized = normalizePath(options.path);
  const canonical = absoluteUrl(options.canonicalPath || normalized);
  const image = options.image || absoluteUrl(seoData.defaultImage);
  const keywords = [...new Set([...(options.keywords || []), ...seoData.defaultKeywords])].join(", ");
  const robots = options.robots || "index, follow";
  const ogType = options.ogType || "website";

  document.documentElement.lang = "ar";
  document.documentElement.dir = "rtl";
  document.title = options.title;

  upsertMeta("name", "description", options.description);
  upsertMeta("name", "keywords", keywords);
  upsertMeta("name", "robots", robots);
  upsertMeta("name", "theme-color", "#164E3C");
  upsertMeta("name", "author", seoData.siteName);

  upsertMeta("property", "og:site_name", seoData.siteName);
  upsertMeta("property", "og:locale", "ar_AR");
  upsertMeta("property", "og:type", ogType);
  upsertMeta("property", "og:title", options.title);
  upsertMeta("property", "og:description", options.description);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:image", image);
  upsertMeta("property", "og:image:alt", options.title);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", options.title);
  upsertMeta("name", "twitter:description", options.description);
  upsertMeta("name", "twitter:image", image);
  upsertMeta("name", "twitter:url", canonical);

  upsertCanonical(canonical);

  if (options.jsonLd) {
    upsertJsonLd(options.jsonLd);
  } else if (normalized === "/") {
    upsertJsonLd(defaultSiteJsonLd());
  }
}

function breadcrumbForPath(normalized: string) {
  if (normalized === "/") return null;
  const segments = normalized.split("/").filter(Boolean);
  const items = [{ name: "الرئيسية", path: "/" }];
  let current = "";
  for (const segment of segments) {
    current += `/${segment}`;
    const matched = routes.find((route) => route.path === current);
    items.push({
      name: matched?.title.split(" | ")[0] || segment,
      path: current,
    });
  }
  return items.length > 1 ? breadcrumbJsonLd(items) : null;
}

export function usePageSeo(path: string) {
  useEffect(() => {
    const route = routeForPath(path);
    const normalized = normalizePath(path);
    const robots =
      route.path === "/404" && normalized !== "/404"
        ? "noindex, follow"
        : route.robots || "index, follow";
    const breadcrumbs = breadcrumbForPath(normalized);
    const pageSchema = webPageJsonLd(route.title, route.description, normalized);
    const jsonLd =
      normalized === "/"
        ? defaultSiteJsonLd()
        : [pageSchema, ...(breadcrumbs ? [breadcrumbs] : []), ...defaultSiteJsonLd()];

    applyPageSeo({
      path: normalized,
      title: route.title,
      description: route.description,
      keywords: route.keywords,
      robots,
      ogType: route.ogType || "website",
      canonicalPath: normalized,
      jsonLd,
    });
  }, [path]);
}

export function useLessonSeo(lesson: KuwaitLessonRecord | null, path: string) {
  useEffect(() => {
    if (!lesson) return;

    const meta = lessonSeoMeta(lesson);
    const breadcrumbs = breadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "الدروس", path: "/lessons" },
      { name: lesson.title, path: meta.canonicalPath },
    ]);

    applyPageSeo({
      path,
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      image: meta.image,
      ogType: meta.ogType,
      canonicalPath: meta.canonicalPath,
      jsonLd: [lessonJsonLd(lesson), breadcrumbs, ...defaultSiteJsonLd()],
    });
  }, [lesson, path]);
}
