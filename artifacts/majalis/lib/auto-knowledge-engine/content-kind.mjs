/**
 * Normalize connector content kinds to publisher-supported values.
 */

const KIND_ALIASES = {
  resolution: "fiqh_decision",
  recommendation: "fiqh_decision",
  ruling: "fiqh_decision",
  sharia_ruling: "sharia_ruling",
  hadith: "article",
  update: "news",
  quran_circle: "quran_circle",
  halaqa: "quran_circle",
  halaqat: "quran_circle",
  mutoon: "mutoon",
  matn: "mutoon",
  annual_course: "annual_course",
  event: "announcement",
};

export function normalizeContentKind(kind, fallback = "article") {
  const raw = String(kind || fallback).trim().toLowerCase();
  return KIND_ALIASES[raw] || raw || fallback;
}
