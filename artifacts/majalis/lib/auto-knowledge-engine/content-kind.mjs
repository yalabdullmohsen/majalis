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
  benefit: "fawaid",
  benefits: "fawaid",
  event: "event",
  events: "event",
  conference: "event",
  podcast: "lesson",
  video: "lesson",
  audio: "lesson",
};

export function normalizeContentKind(kind, fallback = "article") {
  const raw = String(kind || fallback).trim().toLowerCase();
  return KIND_ALIASES[raw] || raw || fallback;
}
