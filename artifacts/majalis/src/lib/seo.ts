import { useEffect } from "react";
import seoData from "./seo-routes.json";

type SeoRoute = {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  robots?: string;
};

const routes = seoData.routes as SeoRoute[];

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

function normalizePath(path: string) {
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
      title: `نتائج البحث: ${term} | مجالس العلم`,
      description: `نتائج البحث عن «${term}» في الدروس والمشايخ والمكتبة والفوائد داخل مجالس العلم.`,
      robots: "noindex, follow",
    };
  }

  if (normalized.startsWith("/sheikhs/")) {
    return {
      ...requiredRoute("/sheikhs"),
      title: "صفحة الشيخ | مجالس العلم",
      description: "تعرف على صفحة الشيخ ودروسه وبياناته العلمية داخل مجالس العلم.",
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

export function usePageSeo(path: string) {
  useEffect(() => {
    const route = routeForPath(path);
    const normalized = normalizePath(path);
    const canonicalPath = route.path === "/404" ? "/404" : normalized;
    const canonical = absoluteUrl(canonicalPath);
    const image = absoluteUrl(seoData.defaultImage);
    const keywords = [...new Set([...route.keywords, ...seoData.defaultKeywords])].join(", ");
    const robots = route.robots || "index, follow";

    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.title = route.title;

    upsertMeta("name", "description", route.description);
    upsertMeta("name", "keywords", keywords);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "theme-color", "#164E3C");

    upsertMeta("property", "og:site_name", seoData.siteName);
    upsertMeta("property", "og:locale", "ar_AR");
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:title", route.title);
    upsertMeta("property", "og:description", route.description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:image:alt", seoData.siteName);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", route.title);
    upsertMeta("name", "twitter:description", route.description);
    upsertMeta("name", "twitter:image", image);
    upsertMeta("name", "twitter:url", canonical);

    upsertCanonical(canonical);
  }, [path]);
}
