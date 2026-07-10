import type { MetadataRoute } from "next";
import seoRoutes from "@/lib/seo-routes.json";
import { fetchSitemapEntries } from "../../lib/supabase/server-data";

const SITE_URL = "https://majlisilm.com";

export const revalidate = 3600;

type SeoRoute = {
  path: string;
  sitemap?: boolean;
  changefreq?: string;
  priority?: number;
};

const PROPHET_SLUGS = [
  "adam", "idris", "nuh", "hud", "salih", "ibrahim", "lut", "ismail",
  "is-haq", "yaqub", "yusuf", "ayyub", "shuayb", "musa", "harun",
  "dhul-kifl", "dawud", "sulayman", "ilyas", "al-yasa", "yunus",
  "zakariyya", "yahya", "isa", "muhammad",
];

function buildStaticRoutes(buildDate: Date): MetadataRoute.Sitemap {
  return (seoRoutes.routes as SeoRoute[])
    .filter((route) => route.sitemap)
    .map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: buildDate,
      changeFrequency: (route.changefreq || "weekly") as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: route.priority ?? 0.7,
    }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const buildDate = new Date();
  const staticRoutes = buildStaticRoutes(buildDate);

  const prophetRoutes: MetadataRoute.Sitemap = PROPHET_SLUGS.map((slug) => ({
    url: `${SITE_URL}/prophets/${slug}`,
    lastModified: buildDate,
    changeFrequency: "monthly" as const,
    priority: 0.82,
  }));

  try {
    const { lessonIds, sheikhIds, libraryIds, storyIds } = await fetchSitemapEntries();

    const lessonRoutes = lessonIds.map((id) => ({
      url: `${SITE_URL}/lessons/${id}`,
      lastModified: buildDate,
      changeFrequency: "weekly" as const,
      priority: 0.72,
    }));

    const sheikhRoutes = sheikhIds.map((id) => ({
      url: `${SITE_URL}/sheikhs/${id}`,
      lastModified: buildDate,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const libraryRoutes = libraryIds.map((id) => ({
      url: `${SITE_URL}/library#${id}`,
      lastModified: buildDate,
      changeFrequency: "weekly" as const,
      priority: 0.68,
    }));

    const storyRoutes = storyIds.map((id) => ({
      url: `${SITE_URL}/stories/${id}`,
      lastModified: buildDate,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...prophetRoutes,
      ...lessonRoutes,
      ...sheikhRoutes,
      ...libraryRoutes,
      ...storyRoutes,
    ];
  } catch (error) {
    console.error("[majalis:sitemap] Falling back to static routes only", error);
    return [...staticRoutes, ...prophetRoutes];
  }
}
