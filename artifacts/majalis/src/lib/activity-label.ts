/** Unified terminology: all lesson-like content displays as «درس/دروس». */
export type ActivityKind = "درس" | "دورة";

const LECTURE_ALIASES = new Set(["محاضرة", "محاضرات", "محاضرة صوتية", "محاضرة مرئية", "lecture", "lectures"]);

export function normalizeActivityType(value?: string | null): ActivityKind {
  const raw = String(value || "").trim();
  if (raw === "دورة" || raw === "course") return "دورة";
  if (LECTURE_ALIASES.has(raw)) return "درس";
  return "درس";
}

export function normalizeActivityLabel(value?: string | null): string {
  return normalizeActivityType(value);
}

export function isCourseActivity(value?: string | null, isCourse?: boolean): boolean {
  return Boolean(isCourse) || normalizeActivityType(value) === "دورة";
}
