import { useEffect } from "react";
import { IA_BREADCRUMB_PARENTS } from "./ia-final-structure";
import {
  ADMIN_DEFAULT_DESCRIPTION,
  ADMIN_DEFAULT_ROBOTS,
  ADMIN_DEFAULT_TITLE,
  isPrivateSeoPath,
} from "./seo-privacy";
import {
  breadcrumbJsonLd,
  defaultSiteJsonLd,
  lessonJsonLd,
  lessonSeoMeta,
  webPageJsonLd,
} from "./seo-structured-data";
import { SEO_SITE } from "./seo-nav-labels";
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

const JSON_LD_ID = "majalis-json-ld";

/** seo-routes.json (~85KB) — يُحمَّل عند الحاجة فقط، لا في حزمة الإقلاع */
let routesCache: SeoRoute[] | null = null;
let routesLoad: Promise<SeoRoute[]> | null = null;

function ensureRoutes(): Promise<SeoRoute[]> {
  if (routesCache) return Promise.resolve(routesCache);
  if (!routesLoad) {
    routesLoad = import("./seo-routes.json").then((m) => {
      const data = m.default as { routes: SeoRoute[] };
      routesCache = data.routes;
      return routesCache;
    });
  }
  return routesLoad;
}

function requiredRoute(routes: SeoRoute[], path: string) {
  const route = routes.find((item) => item.path === path);
  if (!route) {
    throw new Error(`Missing SEO route for ${path}`);
  }
  return route;
}

function absoluteUrl(path: string) {
  return new URL(path, SEO_SITE.siteUrl).toString();
}

export function normalizePath(path: string) {
  const cleanPath = path.split("?")[0].split("#")[0] || "/";
  if (cleanPath !== "/" && cleanPath.endsWith("/")) {
    return cleanPath.slice(0, -1);
  }
  return cleanPath;
}

function routeForPath(routes: SeoRoute[], path: string) {
  const normalized = normalizePath(path);
  const exact = routes.find((route) => route.path === normalized);
  if (exact) return exact;

  if (normalized.startsWith("/search/")) {
    const term = decodeURIComponent(normalized.slice("/search/".length));
    return {
      ...requiredRoute(routes, "/search"),
      title: `نتائج البحث: ${term} | المجلس العلمي`,
      description: `نتائج البحث عن «${term}» في الدروس والمكتبة والفوائد داخل المجلس العلمي.`,
      robots: "noindex, follow",
    };
  }

  if (normalized === "/sheikhs") {
    return requiredRoute(routes, "/sheikhs");
  }

  if (normalized.startsWith("/sheikhs/")) {
    const name = decodeURIComponent(normalized.slice("/sheikhs/".length));
    return {
      ...requiredRoute(routes, "/sheikhs"),
      title: `${name} | المجلس العلمي`,
      description: `ملف الشيخ ${name} — سيرة وإجازات ودروس مرتبطة على المجلس العلمي.`,
    };
  }

  if (normalized.startsWith("/lessons/")) {
    return {
      ...requiredRoute(routes, "/lessons"),
      title: "تفاصيل الدرس | المجلس العلمي",
      description: "تفاصيل الدرس الشرعي — الشيخ، المكان، الجدول، والوصف داخل المجلس العلمي.",
    };
  }

  if (normalized.startsWith("/scientific-announcements/")) {
    return {
      ...requiredRoute(routes, "/lessons"),
      title: "تفاصيل الإعلان العلمي | المجلس العلمي",
      description: "تفاصيل إعلان درس علمي — الشيخ، المتن، الموعد، المكان، والروابط.",
    };
  }

  if (normalized.startsWith("/fiqh-council/")) {
    return {
      ...requiredRoute(routes, "/fiqh-council"),
      title: "قرار المجمع الفقهي | المجلس العلمي",
      description: "تفاصيل قرار أو بحث أو توصية من المجمع الفقهي الإسلامي.",
    };
  }

  if (normalized.startsWith("/rulings/")) {
    return {
      ...requiredRoute(routes, "/fiqh"),
      title: "الفقه الإسلامي | المجلس العلمي",
      description: "بوابة الفقه: قواعد فقهية، مذاهب، نوازل، قرارات المجامع، وأحكام العبادات.",
    };
  }

  if (normalized.startsWith("/annual-courses/")) {
    return {
      ...requiredRoute(routes, "/annual-courses"),
      title: "دورة علمية | المجلس العلمي",
      description: "تفاصيل دورة علمية — الجدول والمشايخ والتسجيل.",
    };
  }

  if (normalized.startsWith("/library/")) {
    return {
      ...requiredRoute(routes, "/library"),
      title: "كتاب شرعي | المجلس العلمي",
      description: "تفاصيل الكتاب — المؤلف، التصنيف، ملخص المحتوى، وروابط التحميل.",
      ogType: "book",
    };
  }

  if (normalized.startsWith("/universities/") && normalized !== "/universities/compare") {
    return {
      ...requiredRoute(routes, "/universities"),
      title: "جامعة إسلامية | المجلس العلمي",
      description: "ملف الجامعة — التخصصات، شروط القبول، معلومات التواصل.",
    };
  }

  if (normalized.startsWith("/lessons/")) {
    return {
      ...requiredRoute(routes, "/lessons"),
      title: "مسار التعلم | المجلس العلمي",
      description: "مسار تعلم مفصّل — المراحل والكتب والاختبارات وشهادة الإتمام.",
    };
  }

  if (normalized.startsWith("/learning/quiz/")) {
    return {
      ...requiredRoute(routes, "/learning/quiz"),
      title: "اختبار علمي | المجلس العلمي",
      description: "اختبار في مسار التعلم — أسئلة متدرجة الصعوبة لتقييم مستواك.",
    };
  }

  if (normalized.startsWith("/learning/certificates/")) {
    return {
      ...requiredRoute(routes, "/learning"),
      title: "التحقق من الشهادة | المجلس العلمي",
      description: "التحقق من صحة شهادة إتمام مسار التعلم الشرعي.",
    };
  }

if (normalized.startsWith("/quran/surah-stories/")) {
    return {
      ...requiredRoute(routes, "/quran/surah-stories"),
      title: "قصة سورة | المجلس العلمي",
      description: "تفاصيل سورة قرآنية — سبب النزول، المحاور، والفوائد.",
      ogType: "article",
    };
  }

  if (normalized.startsWith("/c/")) {
    return {
      ...requiredRoute(routes, "/fiqh-council"),
      title: "مقالة علمية | المجلس العلمي",
      description: "مقالة شرعية من المجلس العلمي — يُراجع المصدر في صفحة المقال عند توافره.",
      ogType: "article",
    };
  }

  if (normalized === "/prophets") {
    return requiredRoute(routes, "/prophets");
  }

  if (normalized === "/nations") {
    return requiredRoute(routes, "/nations");
  }

  if (normalized.startsWith("/nations/")) {
    const nationSlug = decodeURIComponent(normalized.slice("/nations/".length));
    return {
      ...requiredRoute(routes, "/nations"),
      path: normalized,
      title: `الأمم السابقة: ${nationSlug} | المجلس العلمي`,
      description: `قصة الأمة أو القوم «${nationSlug}» كما وردت في القرآن مع التمييز بين الثابت والمحتمل والمواقع التقريبية التي لا يُجزم بها.`,
      ogType: "article",
    };
  }

  if (normalized === "/quran/people") {
    return requiredRoute(routes, "/quran/people");
  }

  if (normalized.startsWith("/quran/people/")) {
    const personSlug = decodeURIComponent(normalized.slice("/quran/people/".length));
    return {
      ...requiredRoute(routes, "/quran/people"),
      path: normalized,
      title: `${personSlug} في القرآن | المجلس العلمي`,
      description: `من ذكروا في القرآن: «${personSlug}» — مواضع الآيات والتعريف بما ثبت دون توسع في غير الثابت.`,
      ogType: "article",
    };
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
      muhammad: "محمد ﷺ",
    };
    const arabicName = PROPHET_NAMES[prophetSlug] || prophetSlug;
    return {
      ...requiredRoute(routes, "/prophets"),
      path: normalized,
      title: `قصة ${arabicName} عليه السلام | المجلس العلمي`,
      description: `قصة نبي الله ${arabicName} عليه السلام — نبذة تعريفية وأبرز صفاته ومعجزاته والدروس المستخلصة من المصادر الموثوقة.`,
      ogType: "article",
    };
  }

  return requiredRoute(routes, "/404");
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
  // المسار الأساسي بلا ? أو # — يمنع تكرار /adhkar/:slug و/lessons?tab= في الفهرسة
  const canonicalPath = normalizePath(options.canonicalPath || normalized);
  const canonical = absoluteUrl(canonicalPath);
  // Prefer explicit page image → route default → branded OG share card
  const imagePath = options.image || SEO_SITE.defaultImage;
  const image = /^https?:\/\//i.test(imagePath) ? imagePath : absoluteUrl(imagePath);
  const robots = options.robots || "index, follow";
  const ogType = options.ogType || "website";

  document.documentElement.lang = "ar";
  document.documentElement.dir = "rtl";
  document.title = options.title;

  upsertMeta("name", "description", options.description);
  // meta keywords ملغاة نهائيًا — أزل أي وسم قديم من SPA أو prerender
  document.querySelector('meta[name="keywords"]')?.remove();
  upsertMeta("name", "robots", robots);
  upsertMeta("name", "color-scheme", "light dark");
  // theme-color ديناميكي (فاتح/داكن) مُدار حصريًا عبر src/lib/theme-preference.ts
  // (applyThemePreference) — لا تكتبه هنا بقيمة ثابتة، فذلك كان يُلغي التزامن مع
  // الوضع الفعلي عند كل تنقّل بين الصفحات (2026-07-18).
  upsertMeta("name", "author", SEO_SITE.siteName);

  upsertMeta("property", "og:site_name", SEO_SITE.siteName);
  upsertMeta("property", "og:locale", "ar_KW");
  upsertMeta("property", "og:type", ogType);
  upsertMeta("property", "og:title", options.title);
  upsertMeta("property", "og:description", options.description);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:image", image);
  upsertMeta("property", "og:image:alt", options.title);
  upsertMeta("property", "og:image:width", String(SEO_SITE.ogImageWidth));
  upsertMeta("property", "og:image:height", String(SEO_SITE.ogImageHeight));

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

function breadcrumbForPath(routes: SeoRoute[], normalized: string) {
  if (normalized === "/") return null;
  const hubParents = IA_BREADCRUMB_PARENTS[normalized];
  if (hubParents?.length) {
    const matched = routes.find((route) => route.path === normalized);
    return breadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      ...hubParents,
      {
        name: matched?.title.split(" | ")[0] || normalized.split("/").pop() || normalized,
        path: normalized,
      },
    ]);
  }
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
    let cancelled = false;
    const normalized = normalizePath(path);
    if (isPrivateSeoPath(normalized)) {
      applyPageSeo({
        path: normalized,
        title: ADMIN_DEFAULT_TITLE,
        description: ADMIN_DEFAULT_DESCRIPTION,
        robots: ADMIN_DEFAULT_ROBOTS,
        ogType: "website",
        canonicalPath: normalized,
        jsonLd: [],
      });
      return;
    }
    void ensureRoutes().then((routes) => {
      if (cancelled) return;
      const route = routeForPath(routes, path);
      const robots =
        route.path === "/404" && normalized !== "/404"
          ? "noindex, follow"
          : route.robots || "index, follow";
      const breadcrumbs = breadcrumbForPath(routes, normalized);
      const pageSchema = webPageJsonLd(route.title, route.description, normalized);
      const jsonLd =
        normalized === "/"
          ? defaultSiteJsonLd()
          : [pageSchema, ...(breadcrumbs ? [breadcrumbs] : []), ...defaultSiteJsonLd()];

      applyPageSeo({
        path: normalized,
        title: route.title,
        description: route.description,
        robots,
        ogType: route.ogType || "website",
        canonicalPath: normalized,
        jsonLd,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [path]);
}

export function useLessonSeo(lesson: KuwaitLessonRecord | null, path: string, loading = false) {
  useEffect(() => {
    if (!lesson) {
      // لا نضع عنوان/ميتا "غير موجود" أثناء التحميل — فقط بعد تأكّد الفشل،
      // لتفادي وميض عنوان خاطئ قبل وصول البيانات.
      if (loading) return;
      applyPageSeo({
        path,
        title: "الدرس غير موجود | المجلس العلمي",
        description: "لم يُعثر على هذا الدرس.",
        robots: "noindex, follow",
        jsonLd: [],
      });
      return;
    }

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
      image: meta.image,
      ogType: meta.ogType,
      canonicalPath: meta.canonicalPath,
      jsonLd: [lessonJsonLd(lesson), breadcrumbs, ...defaultSiteJsonLd()],
    });
  }, [lesson, path, loading]);
}
