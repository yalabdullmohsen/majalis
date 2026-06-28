import { searchFiqhCouncilSeed } from "./fiqh-council-service";
import {
  FATWA_SEED,
  RULINGS_SEED,
  ANNUAL_COURSES_SEED,
  UPDATES_SEED,
} from "./platform-content-service";
import { QURAN_CIRCLES_SEED } from "./quran-circles-seed";
import { MUTOON_SEED } from "./mutoon-seed";
import { arabicMatchAny } from "./arabic-search";

export type PlatformSearchResults = {
  fiqh_decisions: Array<{ id: string; slug?: string; title: string; category?: string; decision_type?: string; searchMeta?: string }>;
  fatwas: Array<{ id: string; question: string; category?: string; format?: string; searchMeta?: string }>;
  rulings: Array<{ id: string; title: string; category?: string; searchMeta?: string }>;
  courses: Array<{ id: string; title: string; course_type?: string; venue_city?: string; searchMeta?: string }>;
  updates: Array<{ id: string; title: string; update_type?: string; searchMeta?: string }>;
  quran_circles: Array<{ id: string; title: string; circle_type?: string; sheikh_name?: string; city?: string; searchMeta?: string }>;
  mutoon: Array<{ id: string; title: string; author?: string; category?: string; level?: string; searchMeta?: string }>;
};

const EMPTY: PlatformSearchResults = {
  fiqh_decisions: [],
  fatwas: [],
  rulings: [],
  courses: [],
  updates: [],
  quran_circles: [],
  mutoon: [],
};

export function searchPlatformSeed(query: string): PlatformSearchResults {
  const q = query.trim();
  if (!q) return EMPTY;

  const fiqh_decisions = searchFiqhCouncilSeed(q);

  const fatwas = FATWA_SEED.filter((f) =>
    arabicMatchAny([f.question, f.answer, f.summary, f.category, ...(f.keywords || [])], q),
  ).map((f) => ({
    id: f.id,
    question: f.question,
    category: f.category,
    format: f.format,
    searchMeta: [f.category, f.mufti_name].filter(Boolean).join(" · "),
  }));

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

  const quran_circles = QURAN_CIRCLES_SEED.filter((c) =>
    arabicMatchAny([c.title, c.summary, c.sheikh_name, c.mosque, c.city, ...(c.keywords || [])], q),
  ).map((c) => ({
    id: c.id,
    title: c.title,
    circle_type: c.circle_type,
    sheikh_name: c.sheikh_name,
    city: c.city,
    searchMeta: [c.circle_type, c.sheikh_name, c.city].filter(Boolean).join(" · "),
  }));

  const mutoon = MUTOON_SEED.filter((m) =>
    arabicMatchAny([m.title, m.author, m.summary, m.body, ...(m.keywords || [])], q),
  ).map((m) => ({
    id: m.id,
    title: m.title,
    author: m.author,
    category: m.category,
    level: m.level,
    searchMeta: [m.category, m.author, m.level].filter(Boolean).join(" · "),
  }));

  return { fiqh_decisions, fatwas, rulings, courses, updates, quran_circles, mutoon };
}
