import { getSheikhById } from "@/lib/supabase";
import { DEMO_COURSES, DEMO_CURRENT_LESSONS } from "@/lib/current-lessons";
import { arabicMatchAny } from "@/lib/arabic-search";

export type SheikhSocialLink = {
  label: string;
  url: string;
  kind: "youtube" | "twitter" | "telegram" | "website" | "other";
};

export type SheikhContentBundle = {
  sheikh: any;
  lessons: any[];
  courses: typeof DEMO_COURSES;
  series: typeof DEMO_COURSES;
  socialLinks: SheikhSocialLink[];
};

function normalizeSheikhName(name?: string) {
  return String(name || "").trim().toLowerCase();
}

function namesMatch(a?: string, b?: string) {
  const left = normalizeSheikhName(a);
  const right = normalizeSheikhName(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function extractSocialLinks(sheikh: any): SheikhSocialLink[] {
  const links: SheikhSocialLink[] = [];
  const candidates: Array<[string, SheikhSocialLink["kind"]]> = [
    ["youtube_url", "youtube"],
    ["twitter_url", "twitter"],
    ["x_url", "twitter"],
    ["telegram_url", "telegram"],
    ["instagram_url", "other"],
    ["website_url", "website"],
    ["official_website", "website"],
  ];

  for (const [field, kind] of candidates) {
    const url = String(sheikh?.[field] || "").trim();
    if (url) {
      links.push({
        label: kind === "youtube" ? "يوتيوب" : kind === "twitter" ? "تويتر" : kind === "telegram" ? "تلغرام" : "الموقع",
        url,
        kind,
      });
    }
  }

  const social = sheikh?.social_links;
  if (social && typeof social === "object") {
    for (const [key, value] of Object.entries(social)) {
      const url = String(value || "").trim();
      if (!url) continue;
      links.push({ label: key, url, kind: "other" });
    }
  }

  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
}

export async function loadSheikhContent(id: string): Promise<SheikhContentBundle | null> {
  const { sheikh, lessons } = await getSheikhById(id);
  if (!sheikh) return null;

  const sheikhName = sheikh.name as string;
  const courses = DEMO_COURSES.filter((c) => namesMatch(c.sheikhName, sheikhName));
  const series = courses.filter((c) => (c.lectures?.length || 0) > 1 || (c.lessons?.length || 0) > 1);

  const announcementLessons = DEMO_CURRENT_LESSONS.filter((l) => namesMatch(l.sheikhName, sheikhName));

  const mergedLessons = [
    ...lessons,
    ...announcementLessons
      .filter((ann) => !lessons.some((l: any) => l.title === ann.title))
      .map((ann) => ({
        id: ann.id,
        title: ann.title,
        mosque: ann.mosque,
        region: ann.region,
        city: "الكويت",
        schedule: `${ann.day} ${ann.time}`.trim(),
        day_of_week: ann.day,
        lesson_time: ann.time,
        category: ann.category,
        description: ann.description,
      })),
  ];

  return {
    sheikh,
    lessons: mergedLessons,
    courses,
    series: series.length > 0 ? series : courses,
    socialLinks: extractSocialLinks(sheikh),
  };
}

export function sheikhMatchesQuery(sheikh: { name?: string; bio?: string; specialties?: string[] }, query: string) {
  return arabicMatchAny(
    [sheikh.name, sheikh.bio, ...(sheikh.specialties || [])],
    query,
  );
}
