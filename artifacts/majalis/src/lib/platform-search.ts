import { searchFiqhCouncilSeed } from "./fiqh-council-service";
import {
  RULINGS_SEED,
  ANNUAL_COURSES_SEED,
  UPDATES_SEED,
} from "./platform-content-service";
import { arabicMatchAny } from "./arabic-search";

export type PlatformSearchResults = {
  fiqh_decisions: Array<{ id: string; slug?: string; title: string; category?: string; decision_type?: string; searchMeta?: string }>;
  rulings: Array<{ id: string; title: string; category?: string; searchMeta?: string }>;
  courses: Array<{ id: string; title: string; course_type?: string; venue_city?: string; searchMeta?: string }>;
  updates: Array<{ id: string; title: string; update_type?: string; searchMeta?: string }>;
};

const EMPTY: PlatformSearchResults = {
  fiqh_decisions: [],
  rulings: [],
  courses: [],
  updates: [],
};

export function searchPlatformSeed(query: string): PlatformSearchResults {
  const q = query.trim();
  if (!q) return EMPTY;

  const fiqh_decisions = searchFiqhCouncilSeed(q);

  const rulings = RULINGS_SEED.filter((r) =>
    arabicMatchAny([r.title, r.summary, r.body, r.category, ...(r.keywords || [])], q),
  ).map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    searchMeta: r.category,
  }));

  const courses = ANNUAL_COURSES_SEED.filter((c) =>
    arabicMatchAny([
      c.title,
      c.summary,
      c.body,
      ...(c.sheikh_names || []),
      ...(c.mutoon || []),
      ...(c.keywords || []),
    ], q),
  ).map((c) => ({
    id: c.id,
    title: c.title,
    course_type: c.course_type,
    venue_city: c.venue_city,
    searchMeta: [c.course_type, c.season, c.venue_city].filter(Boolean).join(" · "),
  }));

  const updates = UPDATES_SEED.filter((u) =>
    arabicMatchAny([u.title, u.summary, u.body, u.update_type], q),
  ).map((u) => ({
    id: u.id,
    title: u.title,
    update_type: u.update_type,
    searchMeta: u.update_type,
  }));

  return { fiqh_decisions, rulings, courses, updates };
}
