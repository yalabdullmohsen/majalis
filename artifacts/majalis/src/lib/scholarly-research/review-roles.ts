/**
 * أدوار مراجعة البحوث — لا يمنح دور واحد اعتماد كل الجوانب تلقائيًا.
 */

export const SCHOLARLY_RESEARCH_ROLES = [
  "ADMIN",
  "CONTENT_EDITOR",
  "ACADEMIC_REVIEWER",
  "METHODOLOGY_REVIEWER",
  "RIGHTS_REVIEWER",
  "VIEWER",
] as const;

export type ScholarlyResearchRole = (typeof SCHOLARLY_RESEARCH_ROLES)[number];

export const SCHOLARLY_REVIEW_ROLE_MAP = {
  source: ["ADMIN", "CONTENT_EDITOR", "ACADEMIC_REVIEWER"] as const,
  academic: ["ADMIN", "ACADEMIC_REVIEWER"] as const,
  rights: ["ADMIN", "RIGHTS_REVIEWER"] as const,
  /** منهجية: بشري مخوّل فقط — لا AI وحده */
  methodology: ["ADMIN", "METHODOLOGY_REVIEWER"] as const,
} as const;

export function roleCanPerformScholarlyReview(
  role: ScholarlyResearchRole,
  kind: keyof typeof SCHOLARLY_REVIEW_ROLE_MAP,
): boolean {
  return (SCHOLARLY_REVIEW_ROLE_MAP[kind] as readonly string[]).includes(role);
}
