import { arabicMatchAny } from "./arabic-search";
import {
  FIQH_COUNCIL_SEED,
  FATWA_SEED,
  RULINGS_SEED,
  ANNUAL_COURSES_SEED,
  UPDATES_SEED,
} from "./platform-content-service";

export type PlatformSearchResults = {
  fiqh_decisions: Array<{ id: string; title: string; category?: string; decision_type?: string; searchMeta?: string }>;
  fatwas: Array<{ id: string; question: string; category?: string; format?: string; searchMeta?: string }>;
  rulings: Array<{ id: string; title: string; category?: string; searchMeta?: string }>;
  courses: Array<{ id: string; title: string; course_type?: string; venue_city?: string; searchMeta?: string }>;
  updates: Array<{ id: string; title: string; update_type?: string; searchMeta?: string }>;
};

const EMPTY: PlatformSearchResults = {
  fiqh_decisions: [],
  fatwas: [],
  rulings: [],
  courses: [],
  updates: [],
};

export function searchPlatformSeed(query: string): PlatformSearchResults {
  const q = query.trim();
  if (!q) return EMPTY;

  const fiqh_decisions = FIQH_COUNCIL_SEED.filter((d) =>
    arabicMatchAny([d.title, d.summary, d.body, d.category, ...(d.keywords || [])], q),
  ).map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    decision_type: d.decision_type,
    searchMeta: [d.decision_type, d.category, d.decision_date].filter(Boolean).join(" · "),
  }));

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

  return { fiqh_decisions, fatwas, rulings, courses, updates };
}
