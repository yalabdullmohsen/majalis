import type { MetadataRoute } from "next";
import seoRoutes from "@/lib/seo-routes.json";
import { fetchSitemapEntries } from "../../lib/supabase/server-data";

const SITE_URL = "https://majlisilm.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const buildDate = new Date();
  const { lessonIds, sheikhIds, libraryIds } = await fetchSitemapEntries();

  const staticRoutes = (seoRoutes.routes as Array<{
    path: string;
    sitemap?: boolean;
    changefreq?: string;
    priority?: number;
  }>)
    .filter((route) => route.sitemap)
    .map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: buildDate,
      changeFrequency: (route.changefreq || "weekly") as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: route.priority ?? 0.7,
    }));

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

  return [...staticRoutes, ...lessonRoutes, ...sheikhRoutes, ...libraryRoutes];
}
